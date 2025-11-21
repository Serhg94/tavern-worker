from sqlmodel import Session, SQLModel, create_engine

from config import settings
from models import *  # noqa: F403

sqlite_file_name = settings.DATABASE_FILE
sqlite_url = f"sqlite:///{sqlite_file_name}"

connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
