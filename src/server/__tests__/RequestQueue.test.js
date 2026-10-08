const { RequestQueue } = require("../domain/coordinator/RequestQueue");

describe("RequestQueue", () => {
  it("enfileira na ordem até o limite", () => {
    const q = new RequestQueue(2);
    expect(q.tryEnqueue({ id: 1 }).accepted).toBe(true);
    expect(q.tryEnqueue({ id: 2 }).accepted).toBe(true);
    expect(q.tryEnqueue({ id: 3 }).accepted).toBe(false);
    expect(q.dequeue().id).toBe(1);
  });

  it("rejeição expõe queue_full", () => {
    const q = new RequestQueue(1);
    q.tryEnqueue({});
    const r = q.tryEnqueue({});
    expect(r.reason).toBe("queue_full");
  });
});
