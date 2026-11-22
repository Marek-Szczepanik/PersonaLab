"""Spuštění indexace z kořene projektu příkazem python -m api.rag."""

import sys

from api.rag.indexer import main

sys.exit(main())
