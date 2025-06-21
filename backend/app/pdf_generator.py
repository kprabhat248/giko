from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch

# --- CORRECTED to Absolute Imports ---
from app import models
# --- END CORRECTION ---

def create_feedback_pdf(feedback: models.Feedback) -> BytesIO:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    
    story = []

    # Title
    story.append(Paragraph(f"Feedback Report for {feedback.recipient.full_name}", styles['h1']))
    story.append(Spacer(1, 0.25*inch))

    # Metadata
    story.append(Paragraph(f"<b>Date:</b> {feedback.created_at.strftime('%Y-%m-%d')}", styles['Normal']))
    story.append(Paragraph(f"<b>From:</b> {feedback.author.full_name} (Manager)", styles['Normal']))
    story.append(Paragraph(f"<b>Sentiment:</b> {feedback.sentiment.value.capitalize()}", styles['Normal']))
    story.append(Spacer(1, 0.25*inch))

    # Strengths
    story.append(Paragraph("Strengths", styles['h2']))
    story.append(Paragraph(feedback.strengths.replace('\n', '<br/>'), styles['BodyText']))
    story.append(Spacer(1, 0.25*inch))

    # Areas to Improve
    story.append(Paragraph("Areas to Improve", styles['h2']))
    story.append(Paragraph(feedback.areas_to_improve.replace('\n', '<br/>'), styles['BodyText']))
    story.append(Spacer(1, 0.5*inch))

    # Comments
    if feedback.comments:
        story.append(Paragraph("Comments", styles['h2']))
        for comment in sorted(feedback.comments, key=lambda c: c.created_at):
            comment_header = f"<b>{comment.author.full_name}</b> on {comment.created_at.strftime('%Y-%m-%d %H:%M')}:"
            story.append(Paragraph(comment_header, styles['Normal']))
            story.append(Paragraph(comment.text.replace('\n', '<br/>'), styles['BodyText']))
            story.append(Spacer(1, 0.1*inch))
    
    doc.build(story)
    buffer.seek(0)
    return buffer