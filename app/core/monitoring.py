import logging
import collections
import time
import psutil
from datetime import datetime
from typing import Deque, List, Dict, Any

# Global buffer to hold recent logs
# Deque is thread-safe for appends and pops from opposite ends
LOG_BUFFER: Deque[Dict[str, Any]] = collections.deque(maxlen=1000)

class LogBufferHandler(logging.Handler):
    """
    Custom logging handler that writes log records to an in-memory buffer.
    """
    def __init__(self):
        super().__init__()
        
    def emit(self, record: logging.LogRecord):
        try:
            log_entry = {
                "timestamp": datetime.fromtimestamp(record.created).isoformat(),
                "level": record.levelname,
                "logger": record.name,
                "message": self.format(record),
                "module": record.module,
                "func": record.funcName,
                "lineno": record.lineno
            }
            LOG_BUFFER.append(log_entry)
        except Exception:
            self.handleError(record)

class SystemMonitor:
    """
    Helper to gather system metrics.
    """
    @staticmethod
    def get_stats() -> Dict[str, Any]:
        cpu_percent = psutil.cpu_percent(interval=None)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return {
            "cpu_percent": cpu_percent,
            "memory": {
                "total": memory.total,
                "available": memory.available,
                "percent": memory.percent,
                "used": memory.used
            },
            "disk": {
                "total": disk.total,
                "free": disk.free,
                "percent": disk.percent
            },
            "timestamp": datetime.now().isoformat()
        }

# Initializer for main app
def setup_monitoring_handler():
    handler = LogBufferHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    
    # Attach to root logger
    root_logger = logging.getLogger()
    root_logger.addHandler(handler)
    # Ensure level allows info
    root_logger.setLevel(logging.INFO)
