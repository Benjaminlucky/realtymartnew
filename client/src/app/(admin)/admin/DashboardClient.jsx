"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { useAuth } from "@/context/useAuth";
import { statsApi } from "@/lib/api";
import Link from "next/link";
import {
  LayoutDashboard,
  MapPin,
  Home,
  BookOpen,
  MessageSquare,
  TrendingUp,
  Eye,
  Plus,
  RefreshCw,
  Users,
  ArrowRight,
  AlertCircle,
  BarChart2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Area,
} from "recharts";

// ── Stat card ─────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, href, loading }) {
  const card = (
    <div
      style={{
        padding: "1.5rem",
        borderRadius: "1rem",
        background: "white",
        border: "1px solid #DDD3D4",
        boxShadow: "0 1px 3px rgba(87,34,40,0.06)",
        transition: "box-shadow 150ms, transform 150ms",
        cursor: href ? "pointer" : "default",
      }}
      onMouseEnter={(e) => {
        if (!href) return;
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(87,34,40,0.1)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(87,34,40,0.06)";
        e.currentTarget.style.transform = "none";
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
        }}
      >
        <p
          style={{
            fontSize: "0.75rem",
            fontFamily: "Plus Jakarta Sans, sans-serif",
            fontWeight: 700,
            color: "#9A7A7E",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            margin: 0,
          }}
        >
          {label}
        </p>
        <div
          style={{
            width: "2.25rem",
            height: "2.25rem",
            borderRadius: "0.625rem",
            background: `${color}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      {loading ? (
        <div
          style={{
            height: "2.5rem",
            borderRadius: "0.5rem",
            background: "#FEF8EE",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      ) : (
        <p
          style={{
            fontFamily: "Plus Jakarta Sans, sans-serif",
            fontWeight: 800,
            fontSize: "2rem",
            color: "#301316",
            margin: 0,
            letterSpacing: "-0.03em",
          }}
        >
          {value ?? "—"}
        </p>
      )}
    </div>
  );
  return href ? (
    <Link href={href} style={{ textDecoration: "none" }}>
      {card}
    </Link>
  ) : (
    card
  );
}

// ── Enquiry row ───────────────────────────────────────────────────
function EnquiryRow({ enquiry }) {
  const sc = {
    new: { bg: "#FEF5E7", color: "#99561c" },
    read: { bg: "#EEE9EA", color: "#361519" },
    replied: { bg: "#FDF0DA", color: "#99561C" },
    closed: { bg: "#FEF8EE", color: "#754A4F" },
  }[enquiry.status] || { bg: "#FEF5E7", color: "#99561c" };
  const name = [enquiry.first_name, enquiry.last_name]
    .filter(Boolean)
    .join(" ");
  const date = new Date(enquiry.createdAt).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "0.875rem 0",
        borderBottom: "1px solid #FFFCF6",
      }}
    >
      <div
        style={{
          width: "2rem",
          height: "2rem",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #F49E0B, #301316)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span style={{ color: "white", fontSize: "0.75rem", fontWeight: 700 }}>
          {name.charAt(0).toUpperCase()}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "Plus Jakarta Sans, sans-serif",
            fontWeight: 600,
            fontSize: "0.875rem",
            color: "#301316",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </p>
        <p style={{ fontSize: "0.75rem", color: "#9A7A7E", margin: 0 }}>
          {enquiry.inquiry_type || "General"} · {enquiry.phone}
        </p>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            padding: "0.2rem 0.6rem",
            borderRadius: "9999px",
            background: sc.bg,
            color: sc.color,
            textTransform: "uppercase",
          }}
        >
          {enquiry.status}
        </span>
        <span style={{ fontSize: "0.75rem", color: "#9A7A7E" }}>{date}</span>
      </div>
    </div>
  );
}

// ── Quick action ──────────────────────────────────────────────────
function QuickAction({ label, description, icon: Icon, href, color }) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          padding: "1rem 1.25rem",
          borderRadius: "0.875rem",
          border: "1px solid #DDD3D4",
          background: "white",
          transition: "all 150ms",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = color;
          e.currentTarget.style.boxShadow = `0 0 0 3px ${color}15`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#DDD3D4";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <div
          style={{
            width: "2.5rem",
            height: "2.5rem",
            borderRadius: "0.625rem",
            background: `${color}12`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={18} style={{ color }} />
        </div>
        <div>
          <p
            style={{
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontWeight: 700,
              fontSize: "0.875rem",
              color: "#301316",
              margin: 0,
            }}
          >
            {label}
          </p>
          <p style={{ fontSize: "0.75rem", color: "#9A7A7E", margin: 0 }}>
            {description}
          </p>
        </div>
        <ArrowRight
          size={14}
          style={{ color: "#9A7A7E", marginLeft: "auto" }}
        />
      </div>
    </Link>
  );
}

// ── Custom recharts tooltip ───────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #DDD3D4",
        borderRadius: "0.625rem",
        padding: "0.625rem 0.875rem",
        boxShadow: "0 4px 12px rgba(87,34,40,0.1)",
        fontFamily: "Plus Jakarta Sans, sans-serif",
      }}
    >
      <p
        style={{
          margin: "0 0 0.25rem",
          fontSize: "0.75rem",
          color: "#9A7A7E",
          fontWeight: 600,
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: "1rem",
          fontWeight: 800,
          color: "#301316",
        }}
      >
        {payload[0].value}{" "}
        <span
          style={{ fontSize: "0.75rem", fontWeight: 500, color: "#9A7A7E" }}
        >
          enquiries
        </span>
      </p>
    </div>
  );
}

// ── Recharts chart ────────────────────────────────────────────────
function EnquiryChart({ data, loading }) {
  const [chartType, setChartType] = useState("bar");

  if (loading) {
    return (
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.25rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <TrendingUp size={16} style={{ color: "#99561c" }} />
            <h2
              style={{
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontWeight: 700,
                fontSize: "1rem",
                color: "#301316",
                margin: 0,
              }}
            >
              Enquiries — Last 6 Months
            </h2>
          </div>
        </div>
        <div
          style={{
            height: "200px",
            borderRadius: "0.75rem",
            background: "#FFFCF6",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "1.25rem",
          }}
        >
          <TrendingUp size={16} style={{ color: "#99561c" }} />
          <h2
            style={{
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              color: "#301316",
              margin: 0,
            }}
          >
            Enquiries — Last 6 Months
          </h2>
        </div>
        <div
          style={{
            height: "200px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "0.5rem",
            color: "#9A7A7E",
          }}
        >
          <BarChart2 size={28} style={{ opacity: 0.4 }} />
          <p style={{ fontSize: "0.875rem", margin: 0 }}>No enquiry data yet</p>
        </div>
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.count, 0);
  const peak = data.reduce((p, d) => (d.count > p.count ? d : p), data[0]);

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <TrendingUp size={16} style={{ color: "#99561c" }} />
          <div>
            <h2
              style={{
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontWeight: 700,
                fontSize: "1rem",
                color: "#301316",
                margin: 0,
              }}
            >
              Enquiries — Last 6 Months
            </h2>
            <p style={{ fontSize: "0.75rem", color: "#9A7A7E", margin: 0 }}>
              {total} total · Peak: {peak.month} ({peak.count})
            </p>
          </div>
        </div>
        {/* Bar / Line toggle */}
        <div
          style={{
            display: "flex",
            background: "#FEF8EE",
            borderRadius: "0.5rem",
            padding: "0.25rem",
            gap: "0.25rem",
          }}
        >
          {["bar", "line"].map((type) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              style={{
                padding: "0.3rem 0.75rem",
                borderRadius: "0.375rem",
                border: "none",
                background: chartType === type ? "white" : "transparent",
                color: chartType === type ? "#301316" : "#9A7A7E",
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontWeight: 600,
                fontSize: "0.75rem",
                cursor: "pointer",
                boxShadow:
                  chartType === type ? "0 1px 3px rgba(87,34,40,0.08)" : "none",
                transition: "all 150ms",
                textTransform: "capitalize",
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={200}>
        {chartType === "bar" ? (
          <BarChart
            data={data}
            margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
            barCategoryGap="35%"
          >
            <defs>
              <linearGradient id="coralGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F49E0B" />
                <stop offset="100%" stopColor="#99561C" stopOpacity={0.85} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#FEF8EE"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{
                fontSize: 11,
                fill: "#9A7A7E",
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontWeight: 600,
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{
                fontSize: 11,
                fill: "#9A7A7E",
                fontFamily: "Plus Jakarta Sans, sans-serif",
              }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "#FFFCF6" }} />
            <Bar
              dataKey="count"
              fill="url(#coralGrad)"
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        ) : (
          <ComposedChart
            data={data}
            margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
          >
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F49E0B" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#F49E0B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#FEF8EE"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{
                fontSize: 11,
                fill: "#9A7A7E",
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontWeight: 600,
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{
                fontSize: 11,
                fill: "#9A7A7E",
                fontFamily: "Plus Jakarta Sans, sans-serif",
              }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              fill="url(#areaGrad)"
              stroke="none"
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#F49E0B"
              strokeWidth={2.5}
              dot={{ fill: "#F49E0B", strokeWidth: 0, r: 4 }}
              activeDot={{
                r: 6,
                fill: "#F49E0B",
                stroke: "white",
                strokeWidth: 2,
              }}
            />
          </ComposedChart>
        )}
      </ResponsiveContainer>

      {/* Month summary strip */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginTop: "1rem",
          paddingTop: "1rem",
          borderTop: "1px solid #FEF8EE",
          overflowX: "auto",
        }}
      >
        {data.map((d) => (
          <div
            key={d.month}
            style={{
              flex: "0 0 auto",
              textAlign: "center",
              minWidth: "2.5rem",
            }}
          >
            <p
              style={{
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontWeight: 700,
                fontSize: "0.875rem",
                color: d.count === peak.count ? "#F49E0B" : "#301316",
                margin: "0 0 0.2rem",
              }}
            >
              {d.count}
            </p>
            <p style={{ fontSize: "0.65rem", color: "#9A7A7E", margin: 0 }}>
              {d.month}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main dashboard — receives server-prefetched stats as props ────
// Props:
//   initialStats  — data fetched server-side (null if unauthenticated/error)
//   initialError  — error message string if server fetch failed
export default function DashboardClient({
  initialStats = null,
  initialError = null,
}) {
  const { user } = useAuth();
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(false); // already loaded server-side
  const [error, setError] = useState(initialError);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await statsApi.getDashboard();
      setStats(res.data);
    } catch (err) {
      setError(err.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  // No useEffect needed — data arrives via props from the server component

  const counts = stats?.counts || {};
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <AdminShell newEnquiries={counts.new_enquiries || 0}>
      <div style={{ padding: "2rem", maxWidth: "1200px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "2rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "0.25rem",
              }}
            >
              <LayoutDashboard size={20} style={{ color: "#99561c" }} />
              <h1
                style={{
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  fontWeight: 800,
                  fontSize: "1.5rem",
                  color: "#301316",
                  margin: 0,
                }}
              >
                Dashboard
              </h1>
            </div>
            <p style={{ color: "#9A7A7E", fontSize: "0.875rem", margin: 0 }}>
              {greeting}
              {user?.name ? `, ${user.name.split(" ")[0]}` : ""}. Here&apos;s
              what&apos;s happening.
            </p>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.625rem",
              border: "1px solid #DDD3D4",
              background: "white",
              color: "#754A4F",
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontWeight: 600,
              fontSize: "0.8125rem",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            <RefreshCw
              size={13}
              style={{
                animation: loading ? "spin 1s linear infinite" : "none",
              }}
            />{" "}
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "1rem 1.25rem",
              borderRadius: "0.875rem",
              background: "#F2EDEE",
              border: "1px solid #9A7A7E",
              marginBottom: "1.5rem",
            }}
          >
            <AlertCircle
              size={16}
              style={{ color: "#4E1F24", flexShrink: 0 }}
            />
            <p style={{ color: "#4E1F24", fontSize: "0.875rem", margin: 0 }}>
              {error}
            </p>
          </div>
        )}

        {/* Stat cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <StatCard
            label="Land Listings"
            value={counts.lands}
            icon={MapPin}
            color="#F49E0B"
            href="/admin/lands"
            loading={loading}
          />
          <StatCard
            label="House Listings"
            value={counts.houses}
            icon={Home}
            color="#896469"
            href="/admin/houses"
            loading={loading}
          />
          <StatCard
            label="Blog Posts"
            value={counts.blog_posts}
            icon={BookOpen}
            color="#99561C"
            href="/admin/blog"
            loading={loading}
          />
          <StatCard
            label="Total Enquiries"
            value={counts.enquiries}
            icon={MessageSquare}
            color="#572228"
            href="/admin/enquiries"
            loading={loading}
          />
          {(counts.new_enquiries > 0 || loading) && (
            <StatCard
              label="New Enquiries"
              value={counts.new_enquiries}
              icon={TrendingUp}
              color="#4E1F24"
              href="/admin/enquiries"
              loading={loading}
            />
          )}
        </div>

        {/* Chart — full width */}
        <div
          style={{
            background: "white",
            border: "1px solid #DDD3D4",
            borderRadius: "1rem",
            padding: "1.5rem",
            boxShadow: "0 1px 3px rgba(87,34,40,0.06)",
            marginBottom: "1.5rem",
          }}
        >
          <EnquiryChart data={stats?.monthly_enquiries} loading={loading} />
        </div>

        {/* Recent enquiries + Quick actions */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          {/* Enquiries */}
          <div
            style={{
              background: "white",
              border: "1px solid #DDD3D4",
              borderRadius: "1rem",
              padding: "1.5rem",
              boxShadow: "0 1px 3px rgba(87,34,40,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <MessageSquare size={16} style={{ color: "#99561c" }} />
                <h2
                  style={{
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: "#301316",
                    margin: 0,
                  }}
                >
                  Recent Enquiries
                </h2>
              </div>
              <Link
                href="/admin/enquiries"
                style={{
                  fontSize: "0.8125rem",
                  color: "#99561c",
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                View all →
              </Link>
            </div>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    padding: "0.875rem 0",
                    borderBottom: "1px solid #FFFCF6",
                  }}
                >
                  <div
                    style={{
                      height: "0.875rem",
                      borderRadius: "0.25rem",
                      background: "#FEF8EE",
                      marginBottom: "0.4rem",
                      width: "60%",
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  />
                  <div
                    style={{
                      height: "0.75rem",
                      borderRadius: "0.25rem",
                      background: "#FEF8EE",
                      width: "40%",
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  />
                </div>
              ))
            ) : stats?.recent_enquiries?.length ? (
              stats.recent_enquiries.map((e) => (
                <EnquiryRow key={e._id || e.id} enquiry={e} />
              ))
            ) : (
              <p
                style={{
                  color: "#9A7A7E",
                  fontSize: "0.875rem",
                  textAlign: "center",
                  padding: "2rem 0",
                  margin: 0,
                }}
              >
                No enquiries yet
              </p>
            )}
          </div>

          {/* Quick actions */}
          <div
            style={{
              background: "white",
              border: "1px solid #DDD3D4",
              borderRadius: "1rem",
              padding: "1.5rem",
              boxShadow: "0 1px 3px rgba(87,34,40,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1.25rem",
              }}
            >
              <Plus size={16} style={{ color: "#99561c" }} />
              <h2
                style={{
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: "#301316",
                  margin: 0,
                }}
              >
                Quick Actions
              </h2>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.625rem",
              }}
            >
              <QuickAction
                label="Add Land Listing"
                description="Create a new plot or estate"
                icon={MapPin}
                href="/admin/lands"
                color="#F49E0B"
              />
              <QuickAction
                label="Add House Listing"
                description="Add a property for sale/rent"
                icon={Home}
                href="/admin/houses"
                color="#896469"
              />
              <QuickAction
                label="Write Blog Post"
                description="Publish a new article"
                icon={BookOpen}
                href="/admin/blog"
                color="#99561C"
              />
              <QuickAction
                label="Manage Team"
                description="Invite or update staff"
                icon={Users}
                href="/admin/settings/team"
                color="#572228"
              />
            </div>
          </div>
        </div>

        {/* Top viewed lands */}
        {stats?.top_lands?.length > 0 && (
          <div
            style={{
              background: "white",
              border: "1px solid #DDD3D4",
              borderRadius: "1rem",
              padding: "1.5rem",
              boxShadow: "0 1px 3px rgba(87,34,40,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1.25rem",
              }}
            >
              <Eye size={16} style={{ color: "#99561c" }} />
              <h2
                style={{
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: "#301316",
                  margin: 0,
                }}
              >
                Top Viewed Lands
              </h2>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {stats.top_lands.map((land, i) => (
                <div
                  key={land._id || land.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "0.625rem 0",
                    borderBottom:
                      i < stats.top_lands.length - 1
                        ? "1px solid #FFFCF6"
                        : "none",
                  }}
                >
                  <span
                    style={{
                      width: "1.5rem",
                      height: "1.5rem",
                      borderRadius: "50%",
                      background: i === 0 ? "#F49E0B" : "#FEF8EE",
                      color: i === 0 ? "#301316" : "#9A7A7E",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                    }}
                  >
                    {i + 1}
                  </span>
                  <p
                    style={{
                      flex: 1,
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      color: "#301316",
                      margin: 0,
                    }}
                  >
                    {land.estate_name}
                  </p>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      fontSize: "0.8rem",
                      color: "#9A7A7E",
                    }}
                  >
                    <Eye size={12} /> {(land.views_count || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }`}</style>
    </AdminShell>
  );
}
