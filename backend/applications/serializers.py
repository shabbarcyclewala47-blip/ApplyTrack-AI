
from django.contrib.auth import get_user_model
from django.utils import timezone

from rest_framework import serializers

from .models import (
    Interview,
    Job,
    JobApplication,
    Notification,
    UserProfile,
)

User = get_user_model()


# =========================================================
# REGISTER
# =========================================================

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"},
    )

    role = serializers.ChoiceField(
        choices=[
            ("candidate", "Candidate"),
            ("recruiter", "Recruiter"),
            ("interviewer", "Interviewer"),
        ],
        default="candidate",
        write_only=True,
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "password",
            "role",
        ]

    def create(self, validated_data):
        role = validated_data.pop("role", "candidate")
        password = validated_data.pop("password")

        user = User.objects.create_user(
            password=password,
            **validated_data,
        )

        UserProfile.objects.update_or_create(
            user=user,
            defaults={"role": role},
        )

        return user


# =========================================================
# JOB
# =========================================================

class JobSerializer(serializers.ModelSerializer):
    recruiter_username = serializers.CharField(
        source="recruiter.username",
        read_only=True,
    )

    class Meta:
        model = Job
        fields = [
            "id",
            "recruiter",
            "recruiter_username",
            "company_name",
            "title",
            "description",
            "requirements",
            "location",
            "employment_type",
            "salary_min",
            "salary_max",
            "application_deadline",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "recruiter",
            "recruiter_username",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        minimum = attrs.get(
            "salary_min",
            getattr(self.instance, "salary_min", None),
        )
        maximum = attrs.get(
            "salary_max",
            getattr(self.instance, "salary_max", None),
        )

        if (
            minimum is not None
            and maximum is not None
            and minimum > maximum
        ):
            raise serializers.ValidationError({
                "salary_max": (
                    "Maximum salary must be greater than or "
                    "equal to minimum salary."
                )
            })

        return attrs


# =========================================================
# CANDIDATE APPLICATION
# =========================================================

class JobApplicationSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(read_only=True)
    job_title = serializers.CharField(read_only=True)
    location = serializers.CharField(read_only=True)

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    interviews = serializers.SerializerMethodField()

    class Meta:
        model = JobApplication
        fields = [
            "id",
            "job",
            "company_name",
            "job_title",
            "location",
            "full_name",
            "phone",
            "candidate_location",
            "resume",
            "cover_letter",
            "status",
            "status_display",
            "applied_date",
            "job_match_score",
            "matched_skills",
            "missing_skills",
            "resume_feedback",
            "interviews",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "applied_date",
            "job_match_score",
            "matched_skills",
            "missing_skills",
            "resume_feedback",
            "interviews",
            "created_at",
        ]

    def get_interviews(self, obj):
        interviews = obj.interviews.filter(
            status="scheduled"
        ).order_by("scheduled_at")

        return InterviewCandidateSerializer(
            interviews,
            many=True,
            context=self.context,
        ).data


# =========================================================
# APPLY TO A JOB
# =========================================================

class JobApplySerializer(serializers.ModelSerializer):
    job_id = serializers.PrimaryKeyRelatedField(
    queryset=Job.objects.filter(status="published"),
    source="job",
    write_only=True,
)

    class Meta:
        model = JobApplication
        fields = [
            "id",
            "job_id",
            "full_name",
            "phone",
            "candidate_location",
            "resume",
            "cover_letter",
        ]
        read_only_fields = ["id"]

    def validate_resume(self, value):
        if not value.name.lower().endswith(".pdf"):
            raise serializers.ValidationError(
                "Only PDF resumes are supported."
            )

        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError(
                "Resume must be 5 MB or smaller."
            )

        return value

    def validate(self, attrs):
        job = attrs["job"]

        if job.status != "published":
            raise serializers.ValidationError({
                "job_id": "This job is not accepting applications."
            })

        if (
    job.application_deadline
    and job.application_deadline <= timezone.localdate()
        ):
         raise serializers.ValidationError({
        "job_id": "The application deadline has passed."
        })

        user = self.context["request"].user

        if JobApplication.objects.filter(
            user=user,
            job=job,
        ).exists():
            raise serializers.ValidationError({
                "job_id": "You have already applied for this job."
            })

        return attrs

    def create(self, validated_data):
        job = validated_data["job"]

        application = JobApplication.objects.create(
            user=self.context["request"].user,
            job=job,
            company_name=job.company_name,
            job_title=job.title,
            location=job.location,
            **{
                key: value
                for key, value in validated_data.items()
                if key != "job"
            },
        )

        Notification.objects.create(
            recipient=job.recruiter,
            actor=application.user,
            application=application,
            notification_type="application_received",
            title="New job application",
            message=(
                f"{application.full_name} applied for "
                f"{job.title} at {job.company_name}."
            ),
        )

        return application


# =========================================================
# RECRUITER APPLICANT DETAILS
# =========================================================

class RecruiterApplicantSerializer(serializers.ModelSerializer):
    candidate_username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    candidate_email = serializers.EmailField(
        source="user.email",
        read_only=True,
    )

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    class Meta:
        model = JobApplication
        fields = [
            "id",
            "candidate_username",
            "candidate_email",
            "full_name",
            "phone",
            "candidate_location",
            "company_name",
            "job_title",
            "location",
            "resume",
            "cover_letter",
            "status",
            "status_display",
            "applied_date",
            "job_match_score",
            "matched_skills",
            "missing_skills",
            "resume_feedback",
        ]


# =========================================================
# APPLICATION STATUS UPDATE
# =========================================================

class ApplicationStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = ["status"]

    def validate_status(self, value):
        valid_statuses = {
            "applied",
            "under_review",
            "shortlisted",
            "interview",
            "offer",
            "rejected",
        }

        if value not in valid_statuses:
            raise serializers.ValidationError(
                "Please select a valid application status."
            )

        return value


# =========================================================
# INTERVIEW SCHEDULING
# =========================================================

class InterviewSerializer(serializers.ModelSerializer):
    candidate_name = serializers.CharField(
        source="application.full_name",
        read_only=True,
    )

    candidate_email = serializers.EmailField(
        source="application.user.email",
        read_only=True,
    )

    job_title = serializers.CharField(
        source="application.job_title",
        read_only=True,
    )

    company_name = serializers.CharField(
        source="application.company_name",
        read_only=True,
    )

    interviewer_username = serializers.CharField(
        source="interviewer.username",
        read_only=True,
        allow_null=True,
    )

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    class Meta:
        model = Interview
        fields = [
            "id",
            "application",
            "candidate_name",
            "candidate_email",
            "job_title",
            "company_name",
            "recruiter",
            "interviewer",
            "interviewer_username",
            "scheduled_at",
            "duration_minutes",
            "interview_type",
            "round_name",
            "meeting_link",
            "interview_location",
            "instructions",
            "status",
            "status_display",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "recruiter",
            "created_at",
            "updated_at",
        ]

    def validate_duration_minutes(self, value):
        if not 15 <= value <= 240:
            raise serializers.ValidationError(
                "Interview duration must be between 15 and 240 minutes."
            )

        return value

    def validate_scheduled_at(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError(
                "The interview must be scheduled for a future time."
            )

        return value

    def validate_interviewer(self, value):
        if value is None:
            return value

        profile, _ = UserProfile.objects.get_or_create(
            user=value,
            defaults={"role": "candidate"},
        )

        if profile.role != "interviewer":
            raise serializers.ValidationError(
                "The selected user is not registered as an interviewer."
            )

        return value

    def validate(self, attrs):
        interview_type = attrs.get(
            "interview_type",
            getattr(self.instance, "interview_type", "online"),
        )

        meeting_link = attrs.get(
            "meeting_link",
            getattr(self.instance, "meeting_link", ""),
        )

        interview_location = attrs.get(
            "interview_location",
            getattr(self.instance, "interview_location", ""),
        )

        if interview_type == "online" and not meeting_link:
            raise serializers.ValidationError({
                "meeting_link": (
                    "A meeting link is required for online interviews."
                )
            })

        if interview_type == "in_person" and not interview_location:
            raise serializers.ValidationError({
                "interview_location": (
                    "A location is required for in-person interviews."
                )
            })

        return attrs


# =========================================================
# INTERVIEW DETAILS VISIBLE TO CANDIDATES
# =========================================================

class InterviewCandidateSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    class Meta:
        model = Interview
        fields = [
            "id",
            "scheduled_at",
            "duration_minutes",
            "interview_type",
            "round_name",
            "meeting_link",
            "interview_location",
            "instructions",
            "status",
            "status_display",
        ]


# =========================================================
# NOTIFICATIONS
# =========================================================

class NotificationSerializer(serializers.ModelSerializer):
    notification_type_display = serializers.CharField(
        source="get_notification_type_display",
        read_only=True,
    )

    class Meta:
        model = Notification
        fields = [
            "id",
            "application",
            "notification_type",
            "notification_type_display",
            "title",
            "message",
            "is_read",
            "created_at",
        ]
        read_only_fields = fields


        