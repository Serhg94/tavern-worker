from sqlmodel import SQLModel, create_engine, Session
from models import * # Import models to register them

from config import settings

sqlite_file_name = settings.DATABASE_FILE
sqlite_url = f"sqlite:///{sqlite_file_name}"

connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
