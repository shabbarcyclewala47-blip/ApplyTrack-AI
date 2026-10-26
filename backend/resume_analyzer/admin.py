from django.contrib import admin

# Register your models here.

from django.contrib import admin
from .models import Resume, ResumeAnalysis, JobMatch


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "user", "template", "created_at", "updated_at")
    search_fields = ("title", "user__username")
    list_filter = ("template", "created_at")


@admin.register(ResumeAnalysis)
class ResumeAnalysisAdmin(admin.ModelAdmin):
    list_display = ("id", "resume", "created_at")
    search_fields = ("resume__title",)


@admin.register(JobMatch)
class JobMatchAdmin(admin.ModelAdmin):
    list_display = ("id", "resume", "created_at")
    search_fields = ("resume__title",)
