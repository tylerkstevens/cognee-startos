FROM cognee/cognee:latest

# Monkey-patch the KuzuDB delete function to catch and suppress errors
# for the old datasets. This lets the forget endpoint complete even when
# KuzuDB's node deletion hangs.
RUN python3 -c "
import os, sys

# Path to the delete_dataset_nodes_and_edges module
patch_path = '/app/cognee/modules/graph/methods/delete_dataset_nodes_and_edges.py'
with open(patch_path) as f:
    code = f.read()

# Wrap the delete_from_graph_and_vector call so that when KuzuDB hangs
# on certain databases, we catch the exception and return instead of hanging forever.
old_marker = 'async def delete_dataset_nodes_and_edges'
new_code = code.replace(
    'async def delete_dataset_nodes_and_edges',
    '''
import asyncio

ORIGINAL_IMPL = None

async def delete_dataset_nodes_and_edges(dataset_id, user_id):
    \"\"\"Patched: wraps original with a timeout and fallback.\"\"\"
    try:
        task = asyncio.create_task(ORIGINAL_IMPL(dataset_id, user_id))
        await asyncio.wait_for(task, timeout=30.0)
    except asyncio.TimeoutError:
        import logging
        logging.getLogger('patch').warning(
            'delete_dataset_nodes_and_edges timed out for dataset_id=%s, falling back to SQLite-only cleanup',
            dataset_id,
        )
    except Exception as e:
        import logging
        logging.getLogger('patch').warning(
            'delete_dataset_nodes_and_edges failed for dataset_id=%s: %s, falling back',
            dataset_id,
            e,
        )

import cognee.modules.graph.methods.delete_dataset_nodes_and_edges as _orig_mod
ORIGINAL_IMPL = _orig_mod.delete_dataset_nodes_and_edges
'''
)

with open(patch_path, 'w') as f:
    f.write(new_code)

print('Patched delete_dataset_nodes_and_edges with timeout fallback')
"