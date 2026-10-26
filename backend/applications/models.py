from django.conf import settings
from django.db import models
from django.utils import timezone


# =========================================================
# JOB
# =========================================================

class Job(models.Model):

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("closed", "Closed"),
        ("expired", "Expired"),
    ]

    EMPLOYMENT_TYPE_CHOICES = [
        ("full_time", "Full Time"),
        ("part_time", "Part Time"),
        ("internship", "Internship"),
        ("contract", "Contract"),
        ("remote", "Remote"),
    ]

    recruiter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="posted_jobs",
    )

    company_name = models.CharField(max_length=200)
    title = models.CharField(max_length=200)
    description = models.TextField()
    requirements = models.TextField(blank=True)
    location = models.CharField(max_length=200, blank=True)

    employment_type = models.CharField(
        max_length=30,
        choices=EMPLOYMENT_TYPE_CHOICES,
        default="full_time",
    )

    salary_min = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    salary_max = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    application_deadline = models.DateField(
        null=True,
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="draft",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def is_expired(self):
        return (
            self.application_deadline is not None
            and self.application_deadline < timezone.localdate()
        )

    def __str__(self):
        return f"{self.title} - {self.company_name}"


# =========================================================
# JOB APPLICATION
# =========================================================

class JobApplication(models.Model):

    STATUS_CHOICES = [
        ("applied", "Applied"),
        ("under_review", "Under Review"),
        ("shortlisted", "Shortlisted"),
        ("interview", "Interview Scheduled"),
        ("interview_completed", "Interview Completed"),
        ("selected", "Selected"),
        ("rejected", "Rejected"),
        ("withdrawn", "Withdrawn"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="job_applications",
    )

    job = models.ForeignKey(
        Job,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="applications",
    )

    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=30, blank=True)

    candidate_location = models.CharField(
        max_length=200,
        blank=True,
    )

    company_name = models.CharField(max_length=200)
    job_title = models.CharField(max_length=200)
    location = models.CharField(max_length=200, blank=True)

    resume = models.FileField(upload_to="resumes/")
    cover_letter = models.TextField(blank=True)

    job_match_score = models.PositiveSmallIntegerField(default=0)

    matched_skills = models.JSONField(
        default=list,
        blank=True,
    )

    missing_skills = models.JSONField(
        default=list,
        blank=True,
    )

    resume_feedback = models.JSONField(
        default=dict,
        blank=True,
    )

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default="applied",
    )

    applied_date = models.DateTimeField(
        auto_now_add=True,
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-applied_date"]

        constraints = [
            models.UniqueConstraint(
                fields=["user", "job"],
                condition=models.Q(job__isnull=False),
                name="unique_candidate_job_application",
            ),
        ]

    def __str__(self):
        return (
            f"{self.full_name} - "
            f"{self.job_title} at {self.company_name}"
        )


# =========================================================
# USER PROFILE
# =========================================================

class UserProfile(models.Model):

    ROLE_CHOICES = [
        ("candidate", "Candidate"),
        ("recruiter", "Recruiter"),
        ("interviewer", "Interviewer"),
        ("admin", "Administrator"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="candidate",
    )

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.role}"


# =========================================================
# NOTIFICATIONS
# =========================================================

class Notification(models.Model):

    NOTIFICATION_TYPES = [
        ("application_received", "Application Received"),
        ("application_status_updated", "Application Status Updated"),
        ("interview_scheduled", "Interview Scheduled"),
        ("interview_updated", "Interview Updated"),
        ("interview_cancelled", "Interview Cancelled"),
        ("interview_feedback_submitted", "Interview Feedback Submitted"),
        ("final_decision", "Final Hiring Decision"),
    ]

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_notifications",
    )

    application = models.ForeignKey(
        JobApplication,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )

    notification_type = models.CharField(
        max_length=40,
        choices=NOTIFICATION_TYPES,
        default="application_status_updated",
    )

    title = models.CharField(max_length=200)
    message = models.TextField()

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.recipient.username} - {self.title}"


# =========================================================
# INTERVIEW
# =========================================================

class Interview(models.Model):

    INTERVIEW_TYPE_CHOICES = [
        ("online", "Online"),
        ("in_person", "In Person"),
        ("phone", "Phone"),
    ]

    STATUS_CHOICES = [
        ("scheduled", "Scheduled"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    application = models.ForeignKey(
        JobApplication,
        on_delete=models.CASCADE,
        related_name="interviews",
    )

    recruiter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="recruiter_interviews",
    )

    interviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_interviews",
    )

    scheduled_at = models.DateTimeField()

    duration_minutes = models.PositiveSmallIntegerField(default=60)

    interview_type = models.CharField(
        max_length=20,
        choices=INTERVIEW_TYPE_CHOICES,
        default="online",
    )

    round_name = models.CharField(
        max_length=100,
        default="Technical Interview",
    )

    meeting_link = models.URLField(blank=True)

    interview_location = models.CharField(
        max_length=255,
        blank=True,
    )

    instructions = models.TextField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="scheduled",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["scheduled_at"]

    def __str__(self):
        return (
            f"{self.round_name} - "
            f"{self.application.job_title} - "
            f"{self.scheduled_at}"
        )


# =========================================================
# INTERVIEW FEEDBACK
# =========================================================

class InterviewFeedback(models.Model):

    RECOMMENDATION_CHOICES = [
        ("recommend", "Recommend Selection"),
        ("reject", "Recommend Rejection"),
        ("another_round", "Needs Another Interview"),
    ]

    interview = models.OneToOneField(
        Interview,
        on_delete=models.CASCADE,
        related_name="feedback",
    )

    technical_skills_rating = models.PositiveSmallIntegerField()
    communication_rating = models.PositiveSmallIntegerField()
    problem_solving_rating = models.PositiveSmallIntegerField()

    feedback = models.TextField()

    recommendation = models.CharField(
        max_length=20,
        choices=RECOMMENDATION_CHOICES,
    )

    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-submitted_at"]

    def __str__(self):
        return (
            f"Feedback for {self.interview.application.full_name} "
            f"- {self.interview.round_name}"
        )