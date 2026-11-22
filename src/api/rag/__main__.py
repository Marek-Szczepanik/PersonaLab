"""Spuštění indexace z kořene projektu příkazem python -m api.rag."""

import sys

from api.rag.indexing.indexer import main

sys.exit(main())
