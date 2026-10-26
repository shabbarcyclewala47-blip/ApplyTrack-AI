from django.shortcuts import render

# Create your views here.

import logging

from pypdf import PdfReader
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView

from .models import Resume
from .serializers import ResumeSerializer

logger = logging.getLogger(__name__)

MAX_RESUME_SIZE = 5 * 1024 * 1024  # 5 MB


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def analyze_resume(request):
    resume_file = request.FILES.get("resume")

    if not resume_file:
        return Response(
            {"error": "Please upload a resume using the 'resume' field."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if resume_file.size > MAX_RESUME_SIZE:
        return Response(
            {"error": "The resume must be smaller than 5 MB."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not resume_file.name.lower().endswith(".pdf"):
        return Response(
            {"error": "Only PDF resumes are supported."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        reader = PdfReader(resume_file)

        if reader.is_encrypted:
            return Response(
                {"error": "Password-protected PDFs are not supported."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(reader.pages) > 30:
            return Response(
                {"error": "Please upload a PDF containing no more than 30 pages."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        extracted_pages = []

        for page in reader.pages:
            extracted_pages.append(page.extract_text() or "")

        resume_text = "\n".join(extracted_pages).strip()

        if not resume_text:
            return Response(
                {
                    "error": (
                        "No readable text was found. "
                        "The PDF may be scanned or image-based."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        word_count = len(resume_text.split())

        return Response(
            {
                "message": "Resume text extracted successfully.",
                "filename": resume_file.name,
                "page_count": len(reader.pages),
                "word_count": word_count,
                "extracted_text": resume_text,
            },
            status=status.HTTP_200_OK,
        )

    except Exception:
        logger.exception("Resume PDF extraction failed.")

        return Response(
            {
                "error": (
                    "We couldn't read this PDF. "
                    "Please upload a valid, text-based PDF."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

class ResumeListCreateAPIView(ListCreateAPIView):
    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ResumeDetailAPIView(RetrieveUpdateDestroyAPIView):
    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)
