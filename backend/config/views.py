
from django.http import JsonResponse


def home(request):
    return JsonResponse({
        "project": "ApplyTrack AI",
        "tagline": "Your AI-powered career command center",
        "status": "running",
        "version": "1.0.0",
        "features": [
            "Job Application Tracking",
            "AI Resume Analysis",
            "Job Match Scoring",
            "Interview Preparation",        ],
        "api": {
            "authentication": "/api/auth/",
            "admin": "/admin/",
        },
    })
