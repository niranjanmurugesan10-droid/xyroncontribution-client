import { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import api from "./api.js";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import "./styles.css";

const formatAmount = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const safeFileName = (name) =>
  String(name || "moy-report")
    .replace(/[^a-z0-9]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/* =========================
   LOGIN
========================= */

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const { data } = await api.post("/auth/login", form);

      localStorage.setItem("token", data.token);

      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand-icon">💰</div>

        <h1>Xyron Moy Manager</h1>
        <p className="auth-subtitle">
          Manage function contributions digitally.
        </p>

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            required
          />

          {error && <div className="error-box">{error}</div>}

          <button className="primary-btn full-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{" "}
          <Link to="/register">Create account</Link>
        </p>
      </div>
    </div>
  );
}

/* =========================
   REGISTER
========================= */

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      await api.post("/auth/register", form);

      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand-icon">💰</div>

        <h1>Create Account</h1>
        <p className="auth-subtitle">
          Start managing your function contributions.
        </p>

        <form onSubmit={handleSubmit}>
          <label>Name</label>
          <input
            type="text"
            placeholder="Your name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            required
          />

          <label>Email</label>
          <input
            type="email"
            placeholder="Your email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Create password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            required
          />

          {error && <div className="error-box">{error}</div>}

          <button className="primary-btn full-btn" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

/* =========================
   DASHBOARD
========================= */

function Dashboard() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
  });

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const loadEvents = async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/events");

      setEvents(data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const createEvent = async (e) => {
    e.preventDefault();

    try {
      setCreating(true);
      setError("");

      await api.post("/events", form);

      setForm({
        title: "",
        description: "",
        date: "",
        location: "",
      });

      setShowCreate(false);

      loadEvents();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create event");
    } finally {
      setCreating(false);
    }
  };

  const deleteEvent = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this event?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/events/${id}`);

      setEvents((prev) => prev.filter((event) => event._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Unable to delete event");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const totalEvents = events.length;

  return (
    <div className="app-page">
      <header className="topbar">
        <div>
          <div className="logo-text">
            <span>💰</span>
            Xyron Moy Manager
          </div>
          <p>Digital function contribution management</p>
        </div>

        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </header>

      <main className="container">
        <section className="hero-section">
          <div>
            <span className="eyebrow">Dashboard</span>
            <h1>Your Functions</h1>
            <p>
              Create and manage wedding, ear-piercing and other
              function contribution records.
            </p>
          </div>

          <button
            className="primary-btn"
            onClick={() => setShowCreate(!showCreate)}
          >
            + Create Function
          </button>
        </section>

        <div className="dashboard-stats">
          <div className="stat-card">
            <span>📅</span>
            <div>
              <small>Total Functions</small>
              <strong>{totalEvents}</strong>
            </div>
          </div>

          <div className="stat-card">
            <span>☁️</span>
            <div>
              <small>Storage</small>
              <strong>Cloud Ready</strong>
            </div>
          </div>

          <div className="stat-card">
            <span>📱</span>
            <div>
              <small>Access</small>
              <strong>Any Device</strong>
            </div>
          </div>
        </div>

        {showCreate && (
          <section className="create-card">
            <div className="section-heading">
              <div>
                <h2>Create New Function</h2>
                <p>Add your function details.</p>
              </div>

              <button
                className="icon-btn"
                onClick={() => setShowCreate(false)}
              >
                ✕
              </button>
            </div>

            <form className="event-form" onSubmit={createEvent}>
              <div className="form-grid">
                <div>
                  <label>Function Name</label>
                  <input
                    placeholder="Example: Arun Wedding"
                    value={form.title}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        title: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <label>Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        date: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label>Location</label>
                  <input
                    placeholder="Example: Chennai"
                    value={form.location}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        location: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label>Description</label>
                  <input
                    placeholder="Optional"
                    value={form.description}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {error && <div className="error-box">{error}</div>}

              <button className="primary-btn" disabled={creating}>
                {creating ? "Creating..." : "Create Function"}
              </button>
            </form>
          </section>
        )}

        <section className="events-section">
          <div className="section-heading">
            <div>
              <h2>My Functions</h2>
              <p>Open a function to manage contributions.</p>
            </div>
          </div>

          {loading ? (
            <div className="empty-card">Loading functions...</div>
          ) : events.length === 0 ? (
            <div className="empty-card">
              <div className="empty-icon">📋</div>
              <h3>No functions yet</h3>
              <p>Create your first function to start recording contributions.</p>

              <button
                className="primary-btn"
                onClick={() => setShowCreate(true)}
              >
                + Create Function
              </button>
            </div>
          ) : (
            <div className="event-grid">
              {events.map((event) => (
                <div className="event-card" key={event._id}>
                  <div className="event-card-top">
                    <div className="event-icon">🎉</div>

                    <button
                      className="danger-icon"
                      onClick={() => deleteEvent(event._id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>

                  <h3>{event.title}</h3>

                  <div className="event-info">
                    {event.date && (
                      <span>📅 {formatDate(event.date)}</span>
                    )}

                    {event.location && (
                      <span>📍 {event.location}</span>
                    )}
                  </div>

                  {event.description && (
                    <p className="event-description">
                      {event.description}
                    </p>
                  )}

                  <Link
                    className="open-event-btn"
                    to={`/events/${event._id}`}
                  >
                    Open Function →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

/* =========================
   PDF GENERATOR
========================= */
function createPDF(event, contributions) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const totalAmount = contributions.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  // PDF-safe amount format
  // ₹ Unicode avoid pannrom because jsPDF default font support problem.
  const pdfAmount = (amount) => {
    return `Rs. ${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  const fileName = `${safeFileName(
    event.title
  )}-moy-report.pdf`;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  /* =========================
     HEADER
  ========================= */

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);

  doc.text(
    event.title || "Function",
    15,
    20
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  doc.text(
    "Moy / Gift Contribution Report",
    15,
    28
  );

  /* =========================
     EVENT DETAILS
  ========================= */

  let y = 39;

  doc.setFontSize(10);

  if (event.date) {
    doc.text(
      `Date: ${formatDate(event.date)}`,
      15,
      y
    );

    y += 6;
  }

  if (event.location) {
    doc.text(
      `Location: ${event.location}`,
      15,
      y
    );

    y += 6;
  }

  /* =========================
     SUMMARY
  ========================= */

  y += 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);

  doc.text(
    `Total People: ${contributions.length}`,
    15,
    y
  );

  doc.text(
    `Total Amount: ${pdfAmount(totalAmount)}`,
    105,
    y
  );

  y += 8;

  /* =========================
     TABLE DATA
  ========================= */

  const rows = contributions.map(
    (item, index) => [
      String(index + 1),
      item.name || "-",
      item.from || "-",
      pdfAmount(item.amount),
    ]
  );

  /* =========================
     TABLE
  ========================= */

  autoTable(doc, {
    startY: y,

    head: [
      [
        "No",
        "Name",
        "From / Relation",
        "Amount",
      ],
    ],

    body: rows,

    theme: "grid",

    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 3.5,
      textColor: [50, 50, 50],
      lineColor: [210, 210, 210],
      lineWidth: 0.2,
      valign: "middle",
    },

    headStyles: {
      font: "helvetica",
      fontStyle: "bold",
      fontSize: 9,
      textColor: [255, 255, 255],
      fillColor: [35, 180, 150],
      halign: "left",
      valign: "middle",
    },

    bodyStyles: {
      font: "helvetica",
      fontStyle: "normal",
    },

    alternateRowStyles: {
      fillColor: [248, 249, 251],
    },

    columnStyles: {
      0: {
        cellWidth: 15,
        halign: "center",
      },

      1: {
        cellWidth: 55,
        halign: "left",
      },

      2: {
        cellWidth: 75,
        halign: "left",
      },

      3: {
        cellWidth: 40,
        halign: "right",
      },
    },

    margin: {
      left: 15,
      right: 15,
      top: 15,
      bottom: 20,
    },

    didDrawPage: function () {
      /* Footer */
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      doc.setTextColor(
        120,
        120,
        120
      );

      doc.text(
        "Xyron Moy Manager",
        15,
        pageHeight - 10
      );

      doc.text(
        `Page ${doc.internal.getNumberOfPages()}`,
        pageWidth - 15,
        pageHeight - 10,
        {
          align: "right",
        }
      );
    },
  });

  /* =========================
     FINAL TOTAL
  ========================= */

  const finalY =
    doc.lastAutoTable.finalY + 8;

  // Only add total box if enough space
  if (finalY < pageHeight - 25) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);

    doc.text(
      "Grand Total",
      15,
      finalY
    );

    doc.text(
      pdfAmount(totalAmount),
      pageWidth - 15,
      finalY,
      {
        align: "right",
      }
    );
  }

  return {
    doc,
    fileName,
    totalAmount,
  };
}
/* =========================
   EVENT PAGE
========================= */

function EventPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [contributions, setContributions] = useState([]);

  const [form, setForm] = useState({
    name: "",
    from: "",
    amount: "",
  });

  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);

      const [eventResponse, contributionResponse] = await Promise.all([
        api.get(`/events/${id}`),
        api.get(`/contributions/${id}`),
      ]);

      setEvent(eventResponse.data);
      setContributions(contributionResponse.data);
    } catch (err) {
      alert(err.response?.data?.message || "Unable to load function");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const totalAmount = useMemo(() => {
    return contributions.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );
  }, [contributions]);

  const filteredContributions = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return contributions;

    return contributions.filter((item) => {
      return (
        item.name?.toLowerCase().includes(value) ||
        item.from?.toLowerCase().includes(value) ||
        String(item.amount).includes(value)
      );
    });
  }, [contributions, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.amount) return;

    try {
      setSaving(true);

      if (editingId) {
        const { data } = await api.put(
          `/contributions/${editingId}`,
          {
            name: form.name,
            from: form.from,
            amount: Number(form.amount),
          }
        );

        setContributions((prev) =>
          prev.map((item) =>
            item._id === editingId ? data : item
          )
        );

        setEditingId(null);
      } else {
        const { data } = await api.post(`/contributions/${id}`, {
          name: form.name,
          from: form.from,
          amount: Number(form.amount),
        });

        setContributions((prev) => [data, ...prev]);
      }

      setForm({
        name: "",
        from: "",
        amount: "",
      });
    } catch (err) {
      alert(err.response?.data?.message || "Unable to save contribution");
    } finally {
      setSaving(false);
    }
  };

  const editContribution = (item) => {
    setEditingId(item._id);

    setForm({
      name: item.name || "",
      from: item.from || "",
      amount: item.amount || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);

    setForm({
      name: "",
      from: "",
      amount: "",
    });
  };

  const deleteContribution = async (contributionId) => {
    const confirmDelete = window.confirm(
      "Delete this contribution?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/contributions/${contributionId}`);

      setContributions((prev) =>
        prev.filter((item) => item._id !== contributionId)
      );
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Unable to delete contribution"
      );
    }
  };

  /* DIRECT PDF DOWNLOAD */
  const downloadPDF = () => {
    if (!event) return;

    const { doc, fileName } = createPDF(
      event,
      contributions
    );

    doc.save(fileName);
  };

  /*
    PRINT BUTTON ALSO DOWNLOADS PDF.
    No browser print dialog.
  */
  const printPDF = () => {
    downloadPDF();
  };

  /*
    On supported mobile browsers, Web Share API
    can share the actual PDF file to WhatsApp.
  */
  const sharePDF = async () => {
    if (!event) return;

    const { doc, fileName } = createPDF(
      event,
      contributions
    );

    const blob = doc.output("blob");

    const file = new File(
      [blob],
      fileName,
      {
        type: "application/pdf",
      }
    );

    const message =
      `📋 ${event.title}\n\n` +
      `👥 People: ${contributions.length}\n` +
      `💰 Total: ${formatAmount(totalAmount)}\n\n` +
      `Generated using Xyron Moy Manager`;

    /*
      Mobile browsers supporting file sharing:
      Share sheet -> WhatsApp -> PDF attachment
    */
    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({
        files: [file],
      })
    ) {
      try {
        await navigator.share({
          title: `${event.title} Report`,
          text: message,
          files: [file],
        });

        return;
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }
      }
    }

    /*
      Desktop / unsupported browser fallback:
      Download PDF + open WhatsApp with summary.
    */
    doc.save(fileName);

    const whatsappUrl =
      `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank");
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner"></div>
        <p>Loading function...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="loading-page">
        <h2>Function not found</h2>

        <button
          className="primary-btn"
          onClick={() => navigate("/")}
        >
          Go Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="app-page">
      {/* ================= SCREEN UI ================= */}

      <div className="screen-only">
        <header className="topbar">
          <div>
            <div className="logo-text">
              <span>💰</span>
              Xyron Moy Manager
            </div>
            <p>Digital contribution management</p>
          </div>

          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </header>

        <main className="container event-page-container">
          <div className="back-row">
            <button
              className="back-btn"
              onClick={() => navigate("/")}
            >
              ← Back
            </button>
          </div>

          <section className="event-hero">
            <div>
              <span className="eyebrow">Function</span>

              <h1>{event.title}</h1>

              <div className="event-meta">
                {event.date && (
                  <span>📅 {formatDate(event.date)}</span>
                )}

                {event.location && (
                  <span>📍 {event.location}</span>
                )}
              </div>

              {event.description && (
                <p>{event.description}</p>
              )}
            </div>

            <div className="action-buttons">
              <button
                className="secondary-btn"
                onClick={printPDF}
              >
                🖨️ Print / Download PDF
              </button>

              <button
                className="whatsapp-btn"
                onClick={sharePDF}
              >
                📲 Share PDF
              </button>
            </div>
          </section>

          <section className="stats-grid">
            <div className="big-stat">
              <div className="stat-icon">👥</div>

              <div>
                <small>Total People</small>
                <strong>{contributions.length}</strong>
              </div>
            </div>

            <div className="big-stat money-stat">
              <div className="stat-icon">💰</div>

              <div>
                <small>Total Amount</small>
                <strong>{formatAmount(totalAmount)}</strong>
              </div>
            </div>
          </section>

          <section className="add-card">
            <div className="section-heading">
              <div>
                <h2>
                  {editingId
                    ? "Edit Contribution"
                    : "Add Contribution"}
                </h2>

                <p>
                  Enter the person's name, relation and amount.
                </p>
              </div>

              {editingId && (
                <button
                  className="cancel-btn"
                  onClick={cancelEdit}
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form
              className="contribution-form"
              onSubmit={handleSubmit}
            >
              <div>
                <label>Name</label>

                <input
                  placeholder="Example: Ravi Kumar"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  autoFocus
                  required
                />
              </div>

              <div>
                <label>From / Relation</label>

                <input
                  placeholder="Example: Mama"
                  value={form.from}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      from: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label>Amount</label>

                <input
                  type="number"
                  min="0"
                  placeholder="₹ Amount"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      amount: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <button
                className="primary-btn add-btn"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update"
                  : "+ Add"}
              </button>
            </form>
          </section>

          <section className="table-card">
            <div className="table-header">
              <div>
                <h2>Contributions</h2>

                <p>
                  {filteredContributions.length} of{" "}
                  {contributions.length} records
                </p>
              </div>

              <div className="search-box">
                🔍
                <input
                  placeholder="Search name, relation or amount..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                />
              </div>
            </div>

            {filteredContributions.length === 0 ? (
              <div className="no-data">
                <div>🔎</div>
                <h3>No records found</h3>
                <p>
                  Try another search or add a new contribution.
                </p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>From / Relation</th>
                      <th>Amount</th>
                      <th className="action-column">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredContributions.map(
                      (item, index) => (
                        <tr key={item._id}>
                          <td>{index + 1}</td>

                          <td>
                            <strong>{item.name}</strong>
                          </td>

                          <td>
                            {item.from || "-"}
                          </td>

                          <td className="amount-cell">
                            {formatAmount(item.amount)}
                          </td>

                          <td className="row-actions">
                            <button
                              className="edit-btn"
                              onClick={() =>
                                editContribution(item)
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="delete-btn"
                              onClick={() =>
                                deleteContribution(
                                  item._id
                                )
                              }
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* ================= PRINT REPORT ================= */}

      <div className="print-only">
        <div className="print-report">
          <div className="print-title">
            <h1>{event.title}</h1>

            <h2>Moy / Gift Contribution Report</h2>

            <div className="print-meta">
              {event.date && (
                <span>
                  Date: {formatDate(event.date)}
                </span>
              )}

              {event.location && (
                <span>
                  Location: {event.location}
                </span>
              )}

              <span>
                Total People: {contributions.length}
              </span>

              <span>
                Total Amount: {formatAmount(totalAmount)}
              </span>
            </div>
          </div>

          <table className="print-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Name</th>
                <th>From / Relation</th>
                <th>Amount</th>
              </tr>
            </thead>

            <tbody>
              {contributions.map((item, index) => (
                <tr key={item._id}>
                  <td>{index + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.from || "-"}</td>
                  <td>{formatAmount(item.amount)}</td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr>
                <td colSpan="3">
                  <strong>Total</strong>
                </td>

                <td>
                  <strong>
                    {formatAmount(totalAmount)}
                  </strong>
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="print-footer">
            Generated using Xyron Moy Manager
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   APP
========================= */

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/events/:id"
          element={
            <ProtectedRoute>
              <EventPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;