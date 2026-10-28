import { Icon } from "@/components/home/icon";

const previewTasks = [
  { title: "Finalize the Mehendi guest list", name: "Ananya", done: true },
  { title: "Choose the Sangeet playlist", name: "Aarav", done: true },
  { title: "Confirm the reception flowers", name: "Riya", done: false },
] as const;

export function WeddingPreview() {
  return (
    <div
      className="wedding-preview"
      aria-label="Illustrative wedding dashboard with sample data"
    >
      <div className="preview-topbar">
        <div className="window-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <span>Your wedding, all in one place</span>
        <span className="preview-label">Sample preview</span>
      </div>
      <div className="preview-body">
        <div className="preview-heading">
          <div className="couple">
            <span className="couple-avatar">A&amp;A</span>
            <div>
              <h2>Ananya &amp; Aarav</h2>
              <p>Udaipur · 12–15 December 2027</p>
            </div>
          </div>
          <span className="wedding-badge">
            <Icon name="calendar" />
            Four days. A lifetime of memories.
          </span>
        </div>
        <div className="preview-event-tabs">
          <span className="active">Mehendi</span>
          <span>Haldi</span>
          <span>Sangeet</span>
          <span>Wedding</span>
          <span>Reception</span>
        </div>
        <div className="preview-grid">
          <div className="preview-panel budget-panel">
            <div className="panel-heading">
              <span>Budget at a glance</span>
              <Icon name="wallet" />
            </div>
            <p className="budget-amount">
              ₹8,40,000 <span>/ ₹12,00,000</span>
            </p>
            <p className="muted-small">
              Recorded expenses · 70% of your budget
            </p>
            <div className="budget-bar" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="budget-key">
              <span>
                <i />
                Venue
              </span>
              <span>
                <i />
                Catering
              </span>
              <span>
                <i />
                Other
              </span>
            </div>
            <div className="budget-remaining">
              <span>Room to celebrate</span>
              <strong>₹3,60,000</strong>
            </div>
          </div>
          <div className="preview-panel checklist-panel">
            <div className="panel-heading">
              <span>A little closer to ready</span>
              <span className="soft-badge">18 / 24 tasks</span>
            </div>
            <div className="preview-task-list">
              {previewTasks.map((task) => (
                <div className="preview-task" key={task.title}>
                  <span className={`task-check ${task.done ? "complete" : ""}`}>
                    {task.done && <Icon name="check" />}
                  </span>
                  <div>
                    <p>{task.title}</p>
                    <span>Assigned to {task.name}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="next-event">
              <Icon name="sparkle" />
              <div>
                <span>Next celebration</span>
                <p>Mehendi in the courtyard</p>
              </div>
              <span className="event-date">12 DEC</span>
            </div>
          </div>
          <div className="preview-panel rsvp-panel">
            <div className="panel-heading">
              <span>Guests &amp; RSVPs</span>
              <Icon name="mail" />
            </div>
            <div className="attendance">
              <strong>186</strong>
              <span>attending the Mehendi</span>
            </div>
            <div className="rsvp-track" aria-hidden="true">
              <span />
            </div>
            <div className="rsvp-counts">
              <div>
                <strong>64</strong>
                <span>Households accepted</span>
              </div>
              <div>
                <strong>22</strong>
                <span>Awaiting a response</span>
              </div>
            </div>
            <p className="rsvp-note">
              <Icon name="heart" />
              Every response, one step closer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
