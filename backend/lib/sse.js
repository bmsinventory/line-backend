// Server-Sent Events client manager
const clients = new Set();

function subscribe(res) {
  clients.add(res);
}

function unsubscribe(res) {
  clients.delete(res);
}

// Notify all connected browsers
// type: 'update' (generic reload), 'new_issue', 'assignment'
// data: object to include as JSON payload
function broadcast(type = 'update', data = {}) {
  const msg = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach((res) => {
    try {
      res.write(msg);
    } catch {
      clients.delete(res);
    }
  });
}

module.exports = { subscribe, unsubscribe, broadcast };
