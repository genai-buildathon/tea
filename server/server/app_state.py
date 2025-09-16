from server.core.coordinator import MultimodalServer
from adk.agent import root_agent as _analyze_agent

try:
    from adk.agent_alt import root_agent_alt as _alt_agent
except Exception:
    _alt_agent = None

# Agents registry (path-based switching)
agents = {
    "analyze": _analyze_agent,
}
if _alt_agent is not None:
    agents["summary"] = _alt_agent

# Default export (use analyze)
agent = agents["analyze"]

# Singleton server instance shared across routes
server = MultimodalServer()
