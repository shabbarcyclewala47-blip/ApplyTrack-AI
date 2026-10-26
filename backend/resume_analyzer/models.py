from django.db import models

# Create your models here.

from django.conf import settings
from django.db import models


class Resume(models.Model):
    TEMPLATE_CHOICES = [
        ("professional", "Professional"),
        ("modern", "Modern"),
        ("minimal", "Minimal"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="saved_resumes",
    )
    title = models.CharField(max_length=200, default="My Resume")
    template = models.CharField(
        max_length=30,
        choices=TEMPLATE_CHOICES,
        default="professional",
    )

    personal_info = models.JSONField(default=dict, blank=True)
    summary = models.TextField(blank=True)
    experience = models.JSONField(default=list, blank=True)
    education = models.JSONField(default=list, blank=True)
    skills = models.JSONField(default=list, blank=True)
    projects = models.JSONField(default=list, blank=True)
    certifications = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.title} - {self.user}"


class ResumeAnalysis(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="resume_analyses",
    )
    resume = models.ForeignKey(
        Resume,
        on_delete=models.CASCADE,
        related_name="analyses",
        null=True,
        blank=True,
    )

    uploaded_filename = models.CharField(max_length=255, blank=True)
    extracted_text = models.TextField(blank=True)
    word_count = models.PositiveIntegerField(default=0)
    page_count = models.PositiveIntegerField(default=0)

    score = models.PositiveSmallIntegerField(null=True, blank=True)
    strengths = models.JSONField(default=list, blank=True)
    weaknesses = models.JSONField(default=list, blank=True)
    suggestions = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Resume analysis - {self.user}"


class JobMatch(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="resume_job_matches",
    )
    resume = models.ForeignKey(
        Resume,
        on_delete=models.CASCADE,
        related_name="job_matches",
    )

    job_title = models.CharField(max_length=200)
    company_name = models.CharField(max_length=200, blank=True)
    job_description = models.TextField()

    match_score = models.PositiveSmallIntegerField(null=True, blank=True)
    matching_skills = models.JSONField(default=list, blank=True)
    missing_skills = models.JSONField(default=list, blank=True)
    recommendations = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.job_title} - {self.user}"
