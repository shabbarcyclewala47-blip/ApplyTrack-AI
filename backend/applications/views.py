
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from .models import Job, JobApplication, UserProfile, Interview, Notification
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from io import BytesIO
from pypdf import PdfReader
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .serializers import InterviewSerializer
from .serializers import NotificationSerializer
from .serializers import (
    ApplicationStatusSerializer,
    JobApplicationSerializer,
    JobApplySerializer,
    JobSerializer,
    RecruiterApplicantSerializer,
    RegisterSerializer,
)


def get_user_role(user):
    if user.is_superuser:
        return "admin"

    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={"role": "candidate"},
    )
    return profile.role


class HasRole(permissions.BasePermission):
    allowed_roles = ()

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and get_user_role(request.user) in self.allowed_roles
        )


class IsCandidate(HasRole):
    allowed_roles = ("candidate",)


class IsRecruiter(HasRole):
    allowed_roles = ("recruiter",)


class IsInterviewer(HasRole):
    allowed_roles = ("interviewer",)


class IsPlatformAdmin(HasRole):
    allowed_roles = ("admin",)


class CSRFTokenView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({"csrfToken": get_token(request)})


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        user = authenticate(
            request,
            username=request.data.get("username", ""),
            password=request.data.get("password", ""),
        )

        if user is None:
            return Response(
                {"detail": "Invalid username or password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        role = get_user_role(user)
        login(request, user)

        return Response({
            "detail": "Logged in successfully.",
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": role,
        })


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": get_user_role(user),
        })


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({"detail": "Logged out successfully."})


class PublishedJobListView(generics.ListAPIView):
    serializer_class = JobSerializer
    permission_classes = [IsCandidate]

    def get_queryset(self):
        from django.utils import timezone

        today = timezone.localdate()

        return Job.objects.filter(status="published").filter(
            Q(application_deadline__isnull=True)
            | Q(application_deadline__gte=today)
        )


# Candidate application history and Apply Now.
class JobApplicationListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsCandidate]

    def get_queryset(self):
        return JobApplication.objects.filter(
            user=self.request.user
        ).select_related("job")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return JobApplySerializer
        return JobApplicationSerializer


class JobApplicationDetailView(generics.RetrieveAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsCandidate]

    def get_queryset(self):
        return JobApplication.objects.filter(user=self.request.user)


# Recruiter manages only jobs owned by their account.
class RecruiterJobListCreateView(generics.ListCreateAPIView):
    serializer_class = JobSerializer
    permission_classes = [IsRecruiter]

    def get_queryset(self):
        return Job.objects.filter(recruiter=self.request.user)

    def perform_create(self, serializer):
        serializer.save(recruiter=self.request.user)


class RecruiterJobDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = JobSerializer
    permission_classes = [IsRecruiter]

    def get_queryset(self):
        return Job.objects.filter(recruiter=self.request.user)


# Recruiter sees applicants for a job they own.
class RecruiterApplicantsView(generics.ListAPIView):
    serializer_class = RecruiterApplicantSerializer
    permission_classes = [IsRecruiter]

    def get_queryset(self):
        return JobApplication.objects.filter(
            job_id=self.kwargs["job_id"],
            job__recruiter=self.request.user,
        ).select_related("user", "job")


# Recruiter can update the status of an applicant only for their own job.
class RecruiterApplicantStatusView(generics.UpdateAPIView):
    serializer_class = ApplicationStatusSerializer
    permission_classes = [IsRecruiter]
    http_method_names = ["patch", "options", "head"]

    def get_queryset(self):
        return JobApplication.objects.filter(
            job__recruiter=self.request.user,
            job__isnull=False,
        )
    
    def perform_update(self, serializer):
        old_status = serializer.instance.status
        application = serializer.save()

        # Notify the candidate only when the status actually changes.
        if application.status != old_status:
            Notification.objects.create(
                recipient=application.user,
                actor=self.request.user,
                application=application,
                notification_type="application_status_updated",
                title="Application status updated",
                message=(
                    f"Your application for {application.job_title} "
                    f"at {application.company_name} has been updated "
                    f"to {application.get_status_display()}."
                ),
            )



class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(
            recipient=request.user
        ).select_related(
            "actor", "application", "application__job"
        ).order_by("-created_at")

        unread_count = notifications.filter(is_read=False).count()

        serializer = NotificationSerializer(
            notifications[:50],
            many=True
        )

        return Response({
            "unread_count": unread_count,
            "notifications": serializer.data,
        })


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            notification = Notification.objects.get(
                pk=pk,
                recipient=request.user
            )
        except Notification.DoesNotExist:
            return Response(
                {"detail": "Notification not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        notification.is_read = True
        notification.save(update_fields=["is_read"])

        return Response({
            "message": "Notification marked as read.",
            "id": notification.id,
            "is_read": notification.is_read,
        }) 
        
class ResumeAnalysisView(APIView):
    permission_classes = [IsCandidate]
    parser_classes = [MultiPartParser, FormParser]

    # Canonical skill names and common variations.
    SKILL_ALIASES = {
        "Python": ["python"],
        "Django": ["django"],
        "Django REST Framework": [
            "django rest framework",
            "django-rest-framework",
            "drf",
        ],
        "FastAPI": ["fastapi", "fast api"],
        "JavaScript": ["javascript", "java script"],
        "TypeScript": ["typescript", "type script"],
        "React": ["react", "react.js", "reactjs"],
        "Next.js": ["next.js", "nextjs"],
        "Node.js": ["node.js", "nodejs", "node js"],
        "Express.js": ["express.js", "expressjs"],
        "HTML": ["html", "html5"],
        "CSS": ["css", "css3"],
        "Bootstrap": ["bootstrap"],
        "Tailwind CSS": ["tailwind css", "tailwind"],
        "REST API": ["rest api", "rest apis", "restful api", "restful apis"],
        "GraphQL": ["graphql"],
        "SQL": ["sql"],
        "PostgreSQL": ["postgresql", "postgres"],
        "MySQL": ["mysql"],
        "SQLite": ["sqlite"],
        "MongoDB": ["mongodb", "mongo db"],
        "Redis": ["redis"],
        "Git": ["git"],
        "GitHub": ["github"],
        "Docker": ["docker"],
        "Kubernetes": ["kubernetes", "k8s"],
        "AWS": ["aws", "amazon web services"],
        "Azure": ["microsoft azure", "azure"],
        "Google Cloud": ["google cloud", "gcp"],
        "CI/CD": ["ci/cd", "continuous integration", "continuous deployment"],
        "Linux": ["linux"],
        "Java": ["java"],
        "C++": ["c++"],
        "C#": ["c#"],
        "PHP": ["php"],
        "Machine Learning": ["machine learning", "ml"],
        "Deep Learning": ["deep learning"],
        "Artificial Intelligence": [
            "artificial intelligence",
            "ai",
        ],
        "Natural Language Processing": [
            "natural language processing",
            "nlp",
        ],
        "Generative AI": ["generative ai", "genai", "gen ai"],
        "Large Language Models": [
            "large language model",
            "large language models",
            "llm",
            "llms",
        ],
        "Prompt Engineering": ["prompt engineering"],
        "Pandas": ["pandas"],
        "NumPy": ["numpy"],
        "Data Analysis": ["data analysis", "data analytics"],
        "Data Visualization": ["data visualization"],
        "Scikit-learn": ["scikit-learn", "scikit learn", "sklearn"],
        "TensorFlow": ["tensorflow"],
        "PyTorch": ["pytorch"],
        "Computer Vision": ["computer vision"],
        "OpenCV": ["opencv"],
        "Statistics": ["statistics", "statistical analysis"],
        "Power BI": ["power bi"],
        "Tableau": ["tableau"],
        "Excel": ["excel", "microsoft excel"],
        "pytest": ["pytest"],
        "Unit Testing": ["unit testing", "unit tests"],
        "Automated Testing": ["automated testing", "test automation"],
        "Agile": ["agile"],
        "Scrum": ["scrum"],
        "Problem Solving": ["problem solving", "problem-solving"],
        "Communication": ["communication skills"],
    }

    MINIMUM_SKILLS_FOR_SCORE = 2

    def contains_term(self, text, term):
        """
        Match complete terms instead of accidental substrings.
        For example, Java should not match JavaScript.
        """
        import re

        pattern = (
            r"(?<!\w)"
            + re.escape(term.lower())
            + r"(?!\w)"
        )

        return re.search(pattern, text, flags=re.IGNORECASE) is not None

    def extract_skills(self, text):
        """
        Return canonical skill names found in the supplied text.
        """
        found = []

        for canonical_name, aliases in self.SKILL_ALIASES.items():
            if any(
                self.contains_term(text, alias)
                for alias in aliases
            ):
                found.append(canonical_name)

        return found

    def post(self, request):
        job_id = request.data.get("job_id")
        resume = request.FILES.get("resume")

        if not job_id:
            return Response(
                {"detail": "Please select a job to analyze against."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not resume:
            return Response(
                {"detail": "Please upload your PDF resume."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not resume.name.lower().endswith(".pdf"):
            return Response(
                {"detail": "Only PDF resumes are supported."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if resume.size > 5 * 1024 * 1024:
            return Response(
                {"detail": "Resume must be 5 MB or smaller."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        today = timezone.localdate()

        job = get_object_or_404(
            Job.objects.filter(status="published").filter(
                Q(application_deadline__isnull=True)
                | Q(application_deadline__gte=today)
            ),
            pk=job_id,
        )

        try:
            reader = PdfReader(BytesIO(resume.read()))

            if reader.is_encrypted:
                return Response(
                    {
                        "detail": (
                            "Please upload an unlocked PDF resume."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if len(reader.pages) > 30:
                return Response(
                    {
                        "detail": (
                            "Resume PDF must have 30 pages or fewer."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            resume_text = " ".join(
                page.extract_text() or ""
                for page in reader.pages
            ).lower()

        except Exception:
            return Response(
                {
                    "detail": (
                        "Could not read this PDF. Please upload a valid "
                        "PDF containing selectable text."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not resume_text.strip():
            return Response(
                {
                    "detail": (
                        "No readable text was found. Please upload a "
                        "text-based PDF rather than a scanned image."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        job_text = " ".join([
            job.title or "",
            job.description or "",
            job.requirements or "",
        ]).lower()

        required_skills = self.extract_skills(job_text)
        resume_skills = self.extract_skills(resume_text)

        matched_skills = [
            skill
            for skill in required_skills
            if skill in resume_skills
        ]

        missing_skills = [
            skill
            for skill in required_skills
            if skill not in resume_skills
        ]

        if len(required_skills) >= self.MINIMUM_SKILLS_FOR_SCORE:
            score = round(
                len(matched_skills) / len(required_skills) * 100
            )

            feedback = (
                "Your resume mentions all the recognizable skills "
                "identified in this job listing. Make sure your "
                "projects and experience demonstrate those skills."
                if not missing_skills
                else
                "Your resume matches some of the recognizable skills "
                "in this job listing. Review the missing skills and "
                "highlight relevant projects and experience."
            )

        else:
            score = None

            feedback = (
                "The job listing contains too few recognizable "
                "technical skills to calculate a reliable match score. "
                "The identified skills are shown below. The recruiter "
                "may need to add more specific technical requirements."
            )

        return Response({
            "job_id": job.id,
            "job_title": job.title,
            "match_score": score,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "resume_skills": resume_skills,
            "required_skills": required_skills,
            "feedback": feedback,
            "analysis_type": "keyword_based",
            "message": (
                "This is a skills-based keyword comparison, not a full "
                "AI assessment. A matching keyword does not prove "
                "proficiency."
            ),
        })
# =========================================================
# APPLYTRACK AI — INTERVIEW MANAGEMENT
# =========================================================

class RecruiterInterviewListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        interviews = Interview.objects.filter(
            recruiter=request.user
        ).select_related(
            "application", "interviewer"
        ).order_by("-scheduled_at")

        serializer = InterviewSerializer(
            interviews, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def post(self, request):
        application = get_object_or_404(
            JobApplication,
            pk=request.data.get("application"),
            job__recruiter=request.user,
        )

        serializer = InterviewSerializer(
            data=request.data,
            context={"request": request},
        )

        serializer.is_valid(raise_exception=True)

        interview = serializer.save(
            recruiter=request.user,
            application=application,
        )

        application.status = "interview"
        application.save(update_fields=["status"])

        Notification.objects.create(
            recipient=application.user,
            actor=request.user,
            application=application,
            notification_type="interview_scheduled",
            title="Interview scheduled",
            message=(
                f"Your interview for {application.job_title} "
                f"is scheduled for {interview.scheduled_at}."
            ),
        )

        if interview.interviewer:
            Notification.objects.create(
                recipient=interview.interviewer,
                actor=request.user,
                application=application,
                notification_type="interview_scheduled",
                title="Interview assigned",
                message=(
                    f"You have been assigned to interview "
                    f"{application.full_name} for {application.job_title}."
                ),
            )

        return Response(
            InterviewSerializer(
                interview, context={"request": request}
            ).data,
            status=201,
        )
class RecruiterInterviewDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_interview(self, request, pk):
        profile = UserProfile.objects.filter(user=request.user).first()

        if not profile or profile.role != "recruiter":
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Recruiter access required.")

        return get_object_or_404(
            Interview.objects.select_related(
                "application",
                "recruiter",
                "interviewer",
            ),
            pk=pk,
            recruiter=request.user,
        )

    def get(self, request, pk):
        interview = self.get_interview(request, pk)

        return Response(
            InterviewSerializer(
                interview,
                context={"request": request},
            ).data
        )

    def patch(self, request, pk):
        interview = self.get_interview(request, pk)

        serializer = InterviewSerializer(
            interview,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        interview = serializer.save()

        notification_type = (
            "interview_cancelled"
            if interview.status == "cancelled"
            else "interview_updated"
        )

        title = (
            "Interview cancelled"
            if interview.status == "cancelled"
            else "Interview updated"
        )

        # Notify the candidate.
        Notification.objects.create(
            recipient=interview.application.user,
            actor=request.user,
            application=interview.application,
            notification_type=notification_type,
            title=title,
            message=(
                f"Your interview for {interview.application.job_title} "
                f"has been updated. Status: {interview.status}."
            ),
        )

        # Notify the assigned interviewer.
        if interview.interviewer:
            Notification.objects.create(
                recipient=interview.interviewer,
                actor=request.user,
                application=interview.application,
                notification_type=notification_type,
                title=title,
                message=(
                    f"The interview for "
                    f"{interview.application.full_name} has been updated. "
                    f"Status: {interview.status}."
                ),
            )

        return Response(
            InterviewSerializer(
                interview,
                context={"request": request},
            ).data
        )


class CandidateInterviewListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        interviews = Interview.objects.filter(
            application__user=request.user
        ).select_related(
            "application", "recruiter", "interviewer"
        ).order_by("scheduled_at")

        serializer = InterviewSerializer(
            interviews, many=True, context={"request": request}
        )
        return Response(serializer.data)
class InterviewerInterviewListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if get_user_role(request.user) != "interviewer":
            return Response(
                {"detail": "Interviewer access required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        interviews = Interview.objects.filter(
            interviewer=request.user
        ).select_related(
            "application", "recruiter"
        ).order_by("scheduled_at")

        serializer = InterviewSerializer(
            interviews,
            many=True,
            context={"request": request},
        )


        return Response(serializer.data)

class InterviewerInterviewStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        profile = UserProfile.objects.filter(user=request.user).first()

        if not profile or profile.role != "interviewer":
            return Response(
                {"detail": "Interviewer access required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        interview = get_object_or_404(
            Interview.objects.select_related("application"),
            pk=pk,
            interviewer=request.user,
        )

        new_status = request.data.get("status")

        if new_status not in ["completed", "cancelled"]:
            return Response(
                {"detail": "Choose completed or cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Save the interview status.
        interview.status = new_status
        interview.save(update_fields=["status", "updated_at"])

        application = interview.application

        # Update the candidate's application status when the interview
        # is completed. Do not overwrite a rejected or selected decision.
        if new_status == "completed" and application.status == "interview":
            application.status = "interview_completed"
            application.save(update_fields=["status"])

        # Mark this interview's pending assignment notifications as read.
        Notification.objects.filter(
            recipient=request.user,
            application=application,
            notification_type="interview_scheduled",
            is_read=False,
        ).update(is_read=True)

        # Notify the candidate of the interview status change.
        Notification.objects.create(
            recipient=application.user,
            actor=request.user,
            application=application,
            notification_type=(
                "interview_cancelled"
                if new_status == "cancelled"
                else "interview_updated"
            ),
            title=(
                "Interview cancelled"
                if new_status == "cancelled"
                else "Interview completed"
            ),
            message=(
                f"Your interview for {application.job_title} "
                f"has been marked {new_status}."
            ),
        )

        return Response(
            InterviewSerializer(
                interview,
                context={"request": request},
            ).data
        )


class InterviewerListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Only recruiters can retrieve the interviewer list.
        if get_user_role(request.user) != "recruiter":
            return Response(
                {"detail": "Recruiter access required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        interviewers = UserProfile.objects.filter(
            role="interviewer"
        ).select_related("user")

        return Response([
            {
                "id": item.user.id,
                "username": item.user.username,
                "email": item.user.email,
            }
            for item in interviewers
        ])
