import os
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.app.core.database import SessionLocal, Base, engine
from backend.app.core.security import get_password_hash
from backend.app.models.models import User, Project, ProjectMember, Ticket, Comment, Attachment

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if users already exist
        admin = db.query(User).filter(User.username == "admin").first()
        if admin:
            print("Database already seeded. Skipping...")
            return

        print("Seeding users...")
        users = [
            User(
                email="admin@tracker.io",
                username="admin",
                full_name="Sarah Connor (Lead Admin)",
                hashed_password=get_password_hash("Password123!"),
                role="Admin",
                avatar_color="#8b5cf6",
                is_active=True
            ),
            User(
                email="dev@tracker.io",
                username="developer",
                full_name="Alex Rivera (Senior Dev)",
                hashed_password=get_password_hash("Password123!"),
                role="Developer",
                avatar_color="#3b82f6",
                is_active=True
            ),
            User(
                email="dev2@tracker.io",
                username="elena",
                full_name="Elena Rostova (Frontend Dev)",
                hashed_password=get_password_hash("Password123!"),
                role="Developer",
                avatar_color="#10b981",
                is_active=True
            ),
            User(
                email="viewer@tracker.io",
                username="viewer",
                full_name="John Stakeholder (Auditor)",
                hashed_password=get_password_hash("Password123!"),
                role="Viewer",
                avatar_color="#f59e0b",
                is_active=True
            )
        ]
        db.add_all(users)
        db.commit()

        for u in users:
            db.refresh(u)

        admin, dev1, dev2, viewer = users[0], users[1], users[2], users[3]

        print("Seeding projects...")
        proj_alpha = Project(
            name="Alpha Cloud Platform",
            key="ALPHA",
            description="Core distributed backend, microservices, and customer portal architecture.",
            owner_id=admin.id
        )
        proj_mobile = Project(
            name="Mobile Companion App",
            key="MOB",
            description="Next-generation React Native mobile experience for iOS & Android.",
            owner_id=dev1.id
        )
        db.add_all([proj_alpha, proj_mobile])
        db.commit()
        db.refresh(proj_alpha)
        db.refresh(proj_mobile)

        print("Seeding project members...")
        members = [
            ProjectMember(project_id=proj_alpha.id, user_id=admin.id, role="Admin"),
            ProjectMember(project_id=proj_alpha.id, user_id=dev1.id, role="Developer"),
            ProjectMember(project_id=proj_alpha.id, user_id=dev2.id, role="Developer"),
            ProjectMember(project_id=proj_alpha.id, user_id=viewer.id, role="Viewer"),

            ProjectMember(project_id=proj_mobile.id, user_id=dev1.id, role="Admin"),
            ProjectMember(project_id=proj_mobile.id, user_id=dev2.id, role="Developer"),
            ProjectMember(project_id=proj_mobile.id, user_id=viewer.id, role="Viewer"),
        ]
        db.add_all(members)
        db.commit()

        print("Seeding tickets...")
        tickets = [
            # In Progress
            Ticket(
                key="ALPHA-1",
                ticket_number=1,
                title="Race condition in token refresh under concurrent API bursts",
                description="When multiple parallel requests receive 401 simultaneously, token refresh handler triggers duplicate refresh requests, invalidating the refresh token rotation.",
                type="Bug",
                status="In Progress",
                priority="Urgent",
                order_index=1000.0,
                estimated_hours=6.0,
                project_id=proj_alpha.id,
                reporter_id=admin.id,
                assignee_id=dev1.id
            ),
            # In Review
            Ticket(
                key="ALPHA-2",
                ticket_number=2,
                title="Implement OAuth2 Social Sign-In with GitHub & Google",
                description="Add support for social SSO identity providers. Needs secure callback endpoint, state verification, and account linking.",
                type="Feature",
                status="In Review",
                priority="High",
                order_index=1000.0,
                estimated_hours=12.0,
                project_id=proj_alpha.id,
                reporter_id=admin.id,
                assignee_id=dev2.id
            ),
            # To Do
            Ticket(
                key="ALPHA-3",
                ticket_number=3,
                title="Memory leak in WebSocket client session registry",
                description="Closed client connections remain in active connections dictionary when network disconnection occurs abruptly without close frame.",
                type="Bug",
                status="To Do",
                priority="High",
                order_index=1000.0,
                estimated_hours=4.0,
                project_id=proj_alpha.id,
                reporter_id=dev1.id,
                assignee_id=dev1.id
            ),
            Ticket(
                key="ALPHA-4",
                ticket_number=4,
                title="Add export tickets to CSV and JSON capability",
                description="Allow project leads and stakeholders to download filtered ticket views as CSV for sprint reporting.",
                type="Task",
                status="To Do",
                priority="Medium",
                order_index=2000.0,
                estimated_hours=8.0,
                project_id=proj_alpha.id,
                reporter_id=viewer.id,
                assignee_id=dev2.id
            ),
            # Backlog
            Ticket(
                key="ALPHA-5",
                ticket_number=5,
                title="Benchmark Redis caching layer for ticket search queries",
                description="Measure response latency improvements when caching full text search results for large projects with >10,000 tickets.",
                type="Task",
                status="Backlog",
                priority="Low",
                order_index=1000.0,
                estimated_hours=16.0,
                project_id=proj_alpha.id,
                reporter_id=dev1.id,
                assignee_id=None
            ),
            # Done
            Ticket(
                key="ALPHA-6",
                ticket_number=6,
                title="Initial database schema migrations and JWT authentication",
                description="Created User, Project, Ticket, Comment, and Attachment tables with role-based access control and bcrypt hashing.",
                type="Task",
                status="Done",
                priority="High",
                order_index=1000.0,
                estimated_hours=20.0,
                project_id=proj_alpha.id,
                reporter_id=admin.id,
                assignee_id=dev1.id
            ),

            # Mobile tickets
            Ticket(
                key="MOB-1",
                ticket_number=1,
                title="App crashes on Android 14 when resuming from background",
                description="NullPointerException in MainActivity lifecycle hook when restoring savedInstanceState with expired session.",
                type="Bug",
                status="In Progress",
                priority="Urgent",
                order_index=1000.0,
                estimated_hours=5.0,
                project_id=proj_mobile.id,
                reporter_id=dev1.id,
                assignee_id=dev2.id
            ),
            Ticket(
                key="MOB-2",
                ticket_number=2,
                title="Implement biometric face/fingerprint authentication unlock",
                description="Leverage Android BiometricPrompt and iOS LocalAuthentication for instant biometric vault unlock.",
                type="Feature",
                status="To Do",
                priority="Medium",
                order_index=1000.0,
                estimated_hours=14.0,
                project_id=proj_mobile.id,
                reporter_id=dev1.id,
                assignee_id=dev1.id
            )
        ]
        db.add_all(tickets)
        db.commit()

        for t in tickets:
            db.refresh(t)

        print("Seeding comments and threaded replies...")
        c1 = Comment(
            content="I was able to reproduce this on macOS with 50 concurrent curl requests. Refresh token was consumed by request #1, causing request #2 to get HTTP 401.",
            ticket_id=tickets[0].id,
            author_id=dev1.id,
            parent_id=None
        )
        db.add(c1)
        db.commit()
        db.refresh(c1)

        c1_reply = Comment(
            content="Great catch Alex. Let's add an in-flight promise deduplication mutex on the frontend axios interceptor as well.",
            ticket_id=tickets[0].id,
            author_id=admin.id,
            parent_id=c1.id
        )
        db.add(c1_reply)

        c2 = Comment(
            content="PR is ready for review: https://github.com/company/alpha/pull/42 - all automated tests passing.",
            ticket_id=tickets[1].id,
            author_id=dev2.id,
            parent_id=None
        )
        db.add(c2)
        db.commit()

        print("Database seeded successfully!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

