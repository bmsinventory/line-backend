// Server-Sent Events client manager
const clients = new Set();

function subscribe(res) {
  clients.add(res);
}

function unsubscribe(res) {
  clients.delete(res);
}

// Notify all connected browsers that data has changed
function broadcast() {
  const msg = 'event: update\ndata: {}\n\n';
  clients.forEach((res) => {
    try {
      res.write(msg);
    } catch {
      clients.delete(res);
    }
  });
}

module.exports = { subscribe, unsubscribe, broadcast };
