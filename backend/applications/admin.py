
from django.contrib import admin

from .models import (
    Job,
    JobApplication,
    UserProfile,
    Notification,
    Interview,
    InterviewFeedback,
)


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "company_name",
        "recruiter",
        "employment_type",
        "status",
        "application_deadline",
        "created_at",
    )
    list_filter = ("status", "employment_type", "created_at")
    search_fields = (
        "title",
        "company_name",
        "description",
        "requirements",
        "recruiter__username",
    )


@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = (
        "company_name",
        "job_title",
        "user",
        "status",
        "applied_date",
    )
    list_filter = ("status", "applied_date")
    search_fields = (
        "company_name",
        "job_title",
        "user__username",
        "full_name",
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role")
    list_filter = ("role",)
    search_fields = ("user__username",)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "recipient",
        "notification_type",
        "is_read",
        "created_at",
    )
    list_filter = ("notification_type", "is_read", "created_at")
    search_fields = (
        "title",
        "recipient__username",
        "message",
    )


@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = (
        "application",
        "recruiter",
        "interviewer",
        "scheduled_at",
        "duration_minutes",
        "interview_type",
        "status",
    )
    list_filter = ("status", "interview_type", "scheduled_at")
    search_fields = (
        "application__full_name",
        "application__job_title",
        "recruiter__username",
        "interviewer__username",
    )
    date_hierarchy = "scheduled_at"


@admin.register(InterviewFeedback)
class InterviewFeedbackAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "interview",
        "technical_skills_rating",
        "communication_rating",
        "problem_solving_rating",
        "recommendation",
        "submitted_at",
    )
    list_filter = ("recommendation", "submitted_at")
    search_fields = (
        "interview__round_name",
        "interview__application__full_name",
        "interview__application__job_title",
    )
    readonly_fields = ("submitted_at", "updated_at")
