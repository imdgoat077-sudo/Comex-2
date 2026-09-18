import os
import shutil
import tempfile
import pytest
from graph.store import AgentGraphStore


@pytest.fixture
def temp_db_dir():
    temp_dir = tempfile.mkdtemp()
    db_path = os.path.join(temp_dir, "test_graph.db")
    yield db_path
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def graph_store(temp_db_dir):
    store = AgentGraphStore(temp_db_dir)
    yield store
