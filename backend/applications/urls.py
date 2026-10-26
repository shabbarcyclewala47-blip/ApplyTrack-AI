
from django.urls import path
from .views import NotificationListView, NotificationMarkReadView

from .views import (
    CSRFTokenView,
    CurrentUserView,
    JobApplicationDetailView,
    JobApplicationListCreateView,
    LoginView,
    LogoutView,
    PublishedJobListView,
    RecruiterApplicantStatusView,
    RecruiterApplicantsView,
    RecruiterJobDetailView,
    RecruiterJobListCreateView,
    RegisterView,
    ResumeAnalysisView, 
    RecruiterInterviewListCreateView,
    RecruiterInterviewDetailView,
    CandidateInterviewListView,
    InterviewerInterviewListView,
    InterviewerInterviewStatusView,
    InterviewerListView,
)

urlpatterns = [
    path("csrf/", CSRFTokenView.as_view(), name="csrf"),
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("me/", CurrentUserView.as_view(), name="current_user"),
    path("logout/", LogoutView.as_view(), name="logout"),

    path("jobs/", PublishedJobListView.as_view(), name="published-jobs"),

    path(
        "applications/",
        JobApplicationListCreateView.as_view(),
        name="application-list-create",
    ),
    path(
        "applications/<int:pk>/",
        JobApplicationDetailView.as_view(),
        name="application-detail",
    ),

    path(
        "recruiter/jobs/",
        RecruiterJobListCreateView.as_view(),
        name="recruiter-job-list",
    ),
    path(
        "recruiter/jobs/<int:pk>/",
        RecruiterJobDetailView.as_view(),
        name="recruiter-job-detail",
    ),
    path(
        "recruiter/jobs/<int:job_id>/applicants/",
        RecruiterApplicantsView.as_view(),
        name="recruiter-job-applicants",
    ),
    path(
        "recruiter/applicants/<int:pk>/status/",
        RecruiterApplicantStatusView.as_view(),
        name="recruiter-applicant-status",
    ),
    path(
    "notifications/",
    NotificationListView.as_view(),
    name="notifications",
    ),
    path(
    "notifications/<int:pk>/read/",
    NotificationMarkReadView.as_view(),
    name="notification-mark-read",
    ),
    path(
    "resume/analyze/",
    ResumeAnalysisView.as_view(),
    name="resume-analysis",
    ),
    path(
    "recruiter/interviews/",
    RecruiterInterviewListCreateView.as_view(),
    name="recruiter-interviews",
),
path(
    "recruiter/interviews/<int:pk>/",
    RecruiterInterviewDetailView.as_view(),
    name="recruiter-interview-detail",
),
path(
    "candidate/interviews/",
    CandidateInterviewListView.as_view(),
    name="candidate-interviews",
),
path(
    "interviewer/interviews/",
    InterviewerInterviewListView.as_view(),
    name="interviewer-interviews",
),
path(
    "interviewer/interviews/<int:pk>/status/",
    InterviewerInterviewStatusView.as_view(),
    name="interviewer-interview-status",
),
path(
    "interviewers/",
    InterviewerListView.as_view(),
    name="interviewer-list",
),
]
