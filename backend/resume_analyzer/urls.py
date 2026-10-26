
from django.urls import path

from .views import (
    analyze_resume,
    ResumeListCreateAPIView,
    ResumeDetailAPIView,
)

urlpatterns = [
    path("analyze/", analyze_resume, name="analyze-resume"),
    path("resumes/", ResumeListCreateAPIView.as_view(), name="resume-list-create"),
    path("resumes/<int:pk>/", ResumeDetailAPIView.as_view(), name="resume-detail"),
]
