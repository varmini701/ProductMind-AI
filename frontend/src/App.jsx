import { useMemo, useState } from "react";

import {
  Upload,
  FileText,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Database,
  Search,
  ChevronRight,
  FileSpreadsheet,
  GitCompare,
} from "lucide-react";

import "./styles.css";

const API = "http://127.0.0.1:8000";

function scoreClass(score) {
  if (score >= 90) return "good";
  if (score >= 70) return "warn";
  return "bad";
}

export default function App() {
  const [file, setFile] = useState(null);
  const [csvFile, setCsvFile] = useState(null);

  const [analysis, setAnalysis] = useState(null);
  const [multiSource, setMultiSource] = useState(null);
  const [enrichment, setEnrichment] = useState(null);

  const [loading, setLoading] = useState(false);
  const [multiLoading, setMultiLoading] = useState(false);
  const [enriching, setEnriching] = useState(false);

  const [error, setError] = useState("");
  const [active, setActive] = useState("dashboard");

  const issueCounts = useMemo(() => {
    const issues = analysis?.issues || [];

    return {
      critical: issues.filter(
        (i) => i.severity === "critical"
      ).length,

      warning: issues.filter(
        (i) => i.severity === "warning"
      ).length,
    };
  }, [analysis]);

  /* ============================================
     PDF ONLY ANALYSIS
  ============================================ */

  async function analyze() {
    if (!file) return;

    setLoading(true);
    setError("");
    setEnrichment(null);

    try {
      const form = new FormData();

      form.append("file", file);

      const response = await fetch(
        `${API}/api/analyze`,
        {
          method: "POST",
          body: form,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Analysis failed."
        );
      }

      setAnalysis(data);
      setMultiSource(null);
      setActive("dashboard");
    } catch (err) {
      setError(
        err.message || "Analysis failed."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ============================================
     MULTI-SOURCE ANALYSIS
  ============================================ */

  async function analyzeMultiSource() {
    if (!file || !csvFile) {
      setError(
        "Please select both a PDF and a CSV file."
      );
      return;
    }

    setMultiLoading(true);
    setError("");
    setEnrichment(null);

    try {
      const form = new FormData();

      form.append("pdf_file", file);
      form.append("csv_file", csvFile);

      const response = await fetch(
        `${API}/api/analyze-multi-source`,
        {
          method: "POST",
          body: form,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Multi-source analysis failed."
        );
      }

      console.log(
        "Multi-source analysis:",
        data
      );

      setMultiSource(data);

      /*
       * Keep the canonical PDF product
       * available to the rest of the application.
       */
      if (data.product) {
        setAnalysis((previous) => ({
          ...(previous || {}),
          product: data.product,
        }));
      }

      setActive("conflicts");
    } catch (err) {
      setError(
        err.message ||
          "Multi-source analysis failed."
      );
    } finally {
      setMultiLoading(false);
    }
  }

  /* ============================================
     AI ENRICHMENT
  ============================================ */

  async function enrich() {
    if (!analysis?.product) return;

    setEnriching(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/api/enrich`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            analysis.product
          ),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Enrichment failed."
        );
      }

      setEnrichment(data);
      setActive("enrichment");
    } catch (err) {
      setError(
        err.message || "Enrichment failed."
      );
    } finally {
      setEnriching(false);
    }
  }

  /* ============================================
     MAIN APP
  ============================================ */

  return (
    <div className="app">

      {/* ========================================
          HEADER
      ======================================== */}

      <header className="topbar">

        <div className="brand">

          <div className="brand-mark">
            P
          </div>

          <div>
            <strong>
              ProductMind AI
            </strong>

            <span>
              Industrial Product Intelligence
            </span>
          </div>

        </div>

        <div className="top-pill">
          <span className="dot" />
          Explainable AI Engine
        </div>

      </header>

      {/* ========================================
          LAYOUT
      ======================================== */}

      <div className="layout">

        {/* ======================================
            SIDEBAR
        ====================================== */}

        <aside className="sidebar">

          <nav>

            <NavButton
              active={
                active === "dashboard"
              }
              onClick={() =>
                setActive("dashboard")
              }
              icon={
                <Database size={18} />
              }
              text="Dashboard"
            />

            <NavButton
              active={
                active === "product"
              }
              onClick={() =>
                setActive("product")
              }
              icon={
                <FileText size={18} />
              }
              text="Product Intelligence"
            />

            <NavButton
              active={
                active === "validation"
              }
              onClick={() =>
                setActive("validation")
              }
              icon={
                <ShieldCheck size={18} />
              }
              text="Validation"
            />

            <NavButton
              active={
                active === "conflicts"
              }
              onClick={() =>
                setActive("conflicts")
              }
              icon={
                <GitCompare size={18} />
              }
              text="Source Conflicts"
            />

            <NavButton
              active={
                active === "enrichment"
              }
              onClick={() =>
                setActive("enrichment")
              }
              icon={
                <Sparkles size={18} />
              }
              text="AI Enrichment"
            />

          </nav>

          <div className="sidebar-card">

            <div className="mini-label">
              UniHack MVP
            </div>

            Fragmented product information →
            trusted commerce-ready intelligence.

          </div>

        </aside>

        {/* ======================================
            MAIN CONTENT
        ====================================== */}

        <main className="content">

          <div className="page-head">

            <div className="eyebrow">
              PRODUCT INTELLIGENCE ENGINE
            </div>

            <h1>
              Turn messy product data into trusted
              intelligence.
            </h1>

            <p>
              Combine technical documents and
              product catalogs to extract,
              validate, compare and explain
              product information.
            </p>

          </div>

          {/* ====================================
              ERROR
          ==================================== */}

          {error && (
            <div className="error">

              <XCircle size={18} />

              {error}

            </div>
          )}

          {/* ====================================
              SOURCE UPLOAD
          ==================================== */}

          <section className="upload-card">

            <div className="upload-icon">
              <Upload size={24} />
            </div>

            <div className="upload-copy">

              <h2>
                Analyze product sources
              </h2>

              <p>
                Upload a manufacturer datasheet
                and product catalog to detect
                inconsistencies.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >

                {/* PDF */}

                <label className="file-picker">

                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) =>
                      setFile(
                        e.target.files?.[0] ||
                          null
                      )
                    }
                  />

                  <FileText size={17} />

                  {file
                    ? file.name
                    : "Choose PDF"}

                </label>

                {/* CSV */}

                <label className="file-picker">

                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) =>
                      setCsvFile(
                        e.target.files?.[0] ||
                          null
                      )
                    }
                  />

                  <FileSpreadsheet
                    size={17}
                  />

                  {csvFile
                    ? csvFile.name
                    : "Choose CSV"}

                </label>

              </div>

            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexDirection: "column",
              }}
            >

              {/* MULTI SOURCE */}

              <button
                className="primary"
                onClick={
                  analyzeMultiSource
                }
                disabled={
                  !file ||
                  !csvFile ||
                  multiLoading
                }
              >

                {multiLoading
                  ? "Comparing..."
                  : "Analyze Sources"}

                {!multiLoading && (
                  <ChevronRight
                    size={17}
                  />
                )}

              </button>

              {/* PDF ONLY */}

              <button
                className="secondary"
                onClick={analyze}
                disabled={
                  !file || loading
                }
              >

                {loading
                  ? "Analyzing..."
                  : "PDF Only"}

              </button>

            </div>

          </section>

          {/* ====================================
              DASHBOARD
          ==================================== */}

          {active === "dashboard" &&
            (analysis ? (
              <Dashboard
                analysis={analysis}
                issueCounts={
                  issueCounts
                }
                multiSource={
                  multiSource
                }
              />
            ) : (
              <EmptyState
                text="Upload a PDF above to create your first product intelligence record."
              />
            ))}

          {/* ====================================
              PRODUCT
          ==================================== */}

          {active === "product" &&
            (analysis ? (
              <ProductView
                analysis={analysis}
              />
            ) : (
              <EmptyState
                text="Analyze a product first."
              />
            ))}

          {/* ====================================
              VALIDATION
          ==================================== */}

          {active === "validation" &&
            (analysis ? (
              <ValidationView
                analysis={analysis}
              />
            ) : (
              <EmptyState
                text="Analyze a product first."
              />
            ))}

          {/* ====================================
              CONFLICTS
          ==================================== */}

          {active === "conflicts" &&
            (multiSource ? (
              <ConflictView
                data={multiSource}
              />
            ) : (
              <EmptyState
                text="Upload both a PDF and CSV to compare product sources."
              />
            ))}

          {/* ====================================
              ENRICHMENT
          ==================================== */}

          {active === "enrichment" &&
            (analysis ? (
              <EnrichmentView
                product={
                  analysis.product
                }
                enrichment={
                  enrichment
                }
                enrich={enrich}
                enriching={
                  enriching
                }
              />
            ) : (
              <EmptyState
                text="Analyze a product first."
              />
            ))}

        </main>

      </div>

    </div>
  );
}

/* ============================================
   NAVIGATION
============================================ */

function NavButton({
  active,
  onClick,
  icon,
  text,
}) {
  return (
    <button
      className={
        active
          ? "nav active"
          : "nav"
      }
      onClick={onClick}
    >
      {icon}
      <span>{text}</span>
    </button>
  );
}

/* ============================================
   DASHBOARD
============================================ */

function Dashboard({
  analysis,
  issueCounts,
  multiSource,
}) {
  const p = analysis.product;

  return (
    <>
      <section className="metric-grid">

        <Metric
          title="Quality Score"
          value={`${analysis.quality_score}/100`}
          cls={scoreClass(
            analysis.quality_score
          )}
        />

        <Metric
          title="Completeness"
          value={`${analysis.completeness_score}%`}
          cls={scoreClass(
            analysis.completeness_score
          )}
        />

        <Metric
          title="AI Confidence"
          value={`${analysis.confidence_score}%`}
          cls={scoreClass(
            analysis.confidence_score
          )}
        />

        <Metric
          title="Issues"
          value={
            analysis.issues.length
          }
          cls={
            analysis.issues.length
              ? "warn"
              : "good"
          }
        />

      </section>

      {multiSource && (
        <SourceSummary
          data={multiSource}
        />
      )}

      <section className="two-col">

        {/* CANONICAL PRODUCT */}

        <div className="panel">

          <PanelTitle
            icon={
              <FileText size={18} />
            }
            title="Canonical Product"
          />

          <div className="product-title">

            <div>

              <h2>
                {p.product_name}
              </h2>

              <p>
                {p.category}

                {p.subcategory
                  ? ` · ${p.subcategory}`
                  : ""}
              </p>

            </div>

            <span
              className={`score-badge ${scoreClass(
                analysis.quality_score
              )}`}
            >
              {analysis.quality_score}/100
            </span>

          </div>

          <div className="kv-grid">

            <KV
              label="Manufacturer"
              value={
                p.manufacturer ||
                "Not available"
              }
            />

            <KV
              label="Model"
              value={
                p.model ||
                "Not available"
              }
            />

            <KV
              label="Source pages"
              value={
                analysis.source_pages ||
                0
              }
            />

            <KV
              label="Attributes"
              value={
                p.attributes.length
              }
            />

          </div>

        </div>

        {/* VALIDATION SUMMARY */}

        <div className="panel">

          <PanelTitle
            icon={
              <ShieldCheck size={18} />
            }
            title="Validation Summary"
          />

          <div className="issue-summary">

            <IssueBox
              cls="critical"
              icon={
                <XCircle size={21} />
              }
              count={
                issueCounts.critical
              }
              label="Critical"
            />

            <IssueBox
              cls="warning"
              icon={
                <AlertTriangle
                  size={21}
                />
              }
              count={
                issueCounts.warning
              }
              label="Warnings"
            />

            <IssueBox
              cls="goodbox"
              icon={
                <CheckCircle2
                  size={21}
                />
              }
              count={Math.max(
                0,
                p.attributes.length -
                  analysis.issues.length
              )}
              label="Healthy"
            />

          </div>

        </div>

      </section>

      <AttributeTable
        product={p}
      />
    </>
  );
}

/* ============================================
   SOURCE SUMMARY
============================================ */

function SourceSummary({ data }) {
  return (
    <section className="panel">

      <PanelTitle
        icon={
          <GitCompare size={18} />
        }
        title="Multi-Source Consistency"
      />

      <div className="metric-grid">

        <Metric
          title="Sources"
          value={data.source_count}
          cls="good"
        />

        <Metric
          title="Attributes Compared"
          value={
            data.total_compared
          }
          cls="good"
        />

        <Metric
          title="Matches"
          value={data.matches}
          cls="good"
        />

        <Metric
          title="Conflicts"
          value={
            data.conflict_count
          }
          cls={
            data.conflict_count
              ? "warn"
              : "good"
          }
        />

      </div>

      <div
        style={{
          marginTop: "22px",
          padding: "18px",
          borderRadius: "12px",
          background:
            data.conflict_count > 0
              ? "#fff7ed"
              : "#f0fdf4",
          border:
            data.conflict_count > 0
              ? "1px solid #fed7aa"
              : "1px solid #bbf7d0",
        }}
      >

        <strong>
          Consistency Score:{" "}
          {data.consistency_score}%
        </strong>

        <div
          style={{
            marginTop: "10px",
            height: "10px",
            background: "#e5e7eb",
            borderRadius: "20px",
            overflow: "hidden",
          }}
        >

          <div
            style={{
              width: `${Math.min(
                100,
                Math.max(
                  0,
                  data.consistency_score
                )
              )}%`,
              height: "100%",
              background:
                data.consistency_score >=
                90
                  ? "#16a34a"
                  : data.consistency_score >=
                    70
                  ? "#f59e0b"
                  : "#dc2626",
              borderRadius: "20px",
            }}
          />

        </div>

        <p
          style={{
            marginBottom: 0,
            marginTop: "8px",
          }}
        >
          {data.matches} of{" "}
          {data.total_compared} compared
          attributes agree across sources.
        </p>

      </div>

    </section>
  );
}

/* ============================================
   CONFLICT VIEW
============================================ */

function ConflictView({ data }) {
  return (
    <>
      <section className="metric-grid">

        <Metric
          title="Sources"
          value={data.source_count}
          cls="good"
        />

        <Metric
          title="Attributes Compared"
          value={data.total_compared}
          cls="good"
        />

        <Metric
          title="Matches"
          value={data.matches}
          cls="good"
        />

        <Metric
          title="Conflicts"
          value={data.conflict_count}
          cls={
            data.conflict_count
              ? "warn"
              : "good"
          }
        />

      </section>

      <section className="panel">

        <PanelTitle
          icon={
            <GitCompare size={18} />
          }
          title="Source Conflicts"
        />

        <p className="muted">
          ProductMind compares information
          across independent sources and
          highlights inconsistent product
          attributes.
        </p>

        {data.conflict_count === 0 ? (
          <div className="success-row">

            <CheckCircle2 size={20} />

            No conflicts detected across
            the available sources.

          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              marginTop: "20px",
            }}
          >

            {data.conflicts.map(
              (conflict, index) => (
                <ConflictCard
                  key={index}
                  conflict={conflict}
                  data={data}
                />
              )
            )}

          </div>
        )}

      </section>

      <ComparisonTable
        comparisons={
          data.comparisons || []
        }
      />

      <ReliabilityView
        reliability={
          data.source_reliability
        }
      />

    </>
  );
}

/* ============================================
   CONFLICT CARD
============================================ */

function ConflictCard({ conflict, data }) {
  const [approved, setApproved] = useState(false);

  const reliability = data?.source_reliability || {};

  const pdfScore = Number(
    reliability.manufacturer_datasheet?.score ?? 95
  );
  const csvScore = Number(
    reliability.user_csv?.score ?? 70
  );

  const pdfSource =
    conflict.pdf_source || "Manufacturer Datasheet";
  const csvSource =
    conflict.csv_source || "Product Catalog CSV";

  const pdfPreferred = pdfScore >= csvScore;

  const recommendedValue = pdfPreferred
    ? conflict.pdf_value
    : conflict.csv_value;

  const recommendedSource = pdfPreferred
    ? pdfSource
    : csvSource;

  const recommendedScore = pdfPreferred
    ? pdfScore
    : csvScore;

  const rejectedValue = pdfPreferred
    ? conflict.csv_value
    : conflict.pdf_value;

  const rejectedSource = pdfPreferred
    ? csvSource
    : pdfSource;

  return (
    <article className="conflict-card-final">
      <div className="conflict-card-final__header">
        <div className="conflict-card-final__heading">
          <div className="conflict-card-final__icon">
            <AlertTriangle size={21} />
          </div>
          <div>
            <h3>
              {(conflict.severity || "high").toUpperCase()} CONFLICT
            </h3>
            <p>
              Conflicting product information detected across sources
            </p>
          </div>
        </div>

        <span
          className={
            approved
              ? "conflict-status-final verified"
              : "conflict-status-final review"
          }
        >
          {approved ? (
            <>
              <CheckCircle2 size={14} />
              Verified
            </>
          ) : (
            "Human Review Recommended"
          )}
        </span>
      </div>

      <h4 className="conflict-attribute-final">
        {formatAttribute(conflict.attribute)}
      </h4>

      <div className="source-comparison-final">
        <SourceValueFinal
          source={pdfSource}
          value={conflict.pdf_value}
          reliability={pdfScore}
          preferred={pdfPreferred}
        />

        <div className="vs-final" aria-label="versus">
          VS
        </div>

        <SourceValueFinal
          source={csvSource}
          value={conflict.csv_value}
          reliability={csvScore}
          preferred={!pdfPreferred}
        />
      </div>

      <section className="resolution-final">
        <div className="resolution-final__heading">
          <div className="resolution-final__icon">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h3>Explainable Resolution</h3>
            <p>Recommended value based on source authority</p>
          </div>
        </div>

        <div className="recommended-final">
          <span>RECOMMENDED VALUE</span>
          <strong>{recommendedValue || "Not available"}</strong>
        </div>

        <div className="resolution-grid-final">
          <div>
            <span>PREFERRED SOURCE</span>
            <strong>{recommendedSource}</strong>
          </div>

          <div>
            <span>AUTHORITY SCORE</span>
            <strong>{recommendedScore}%</strong>
          </div>

          <div>
            <span>CONFLICTING VALUE</span>
            <strong>{rejectedValue || "Not available"}</strong>
          </div>
        </div>

        <div className="why-final">
          <h4>Why this value?</h4>
          <p>
            The <b>{recommendedSource}</b> has a higher source-authority
            score of <b>{recommendedScore}%</b> compared with the
            conflicting source, <b>{rejectedSource}</b>.
          </p>
          <p>
            ProductMind therefore recommends <b>{recommendedValue}</b>
            as the preferred value while flagging the discrepancy for
            human verification before publication.
          </p>
        </div>

        {!approved ? (
          <div className="approval-final">
            <div className="approval-final__message">
              <ShieldCheck size={21} />
              <div>
                <strong>Human verification required</strong>
                <span>
                  Review the evidence before approving this value for
                  commerce use.
                </span>
              </div>
            </div>

            <button
              type="button"
              className="approve-final"
              onClick={() => setApproved(true)}
            >
              <CheckCircle2 size={17} />
              Approve {recommendedValue}
            </button>
          </div>
        ) : (
          <div className="approved-final">
            <div className="approved-final__icon">
              <CheckCircle2 size={20} />
            </div>

            <div className="approved-final__copy">
              <strong>Product attribute verified</strong>
              <span>
                {formatAttribute(conflict.attribute)}:{" "}
                <b>{recommendedValue}</b> approved from{" "}
                <b>{recommendedSource}</b>.
              </span>
            </div>

            <span className="verified-tag-final">VERIFIED</span>
          </div>
        )}
      </section>
    </article>
  );
}

/* ============================================
   FINAL SOURCE VALUE
============================================ */

function SourceValueFinal({
  source,
  value,
  reliability,
  preferred,
}) {
  return (
    <div
      className={
        preferred
          ? "source-value-final preferred"
          : "source-value-final"
      }
    >
      {preferred && (
        <div className="preferred-final">
          <CheckCircle2 size={13} />
          Preferred Source
        </div>
      )}

      <div className="source-name-final">
        {source}
      </div>

      <div className="source-number-final">
        {value || "Not available"}
      </div>

      <div className="source-authority-final">
        <span>Source authority</span>
        <strong>{reliability}%</strong>
      </div>
    </div>
  );
}

/* ============================================
   COMPARISON TABLE
============================================ */


function ComparisonTable({
  comparisons,
}) {
  return (
    <section className="panel">

      <PanelTitle
        icon={
          <Search size={18} />
        }
        title="Source Comparison"
      />

      <div className="table">

        <div className="tr header">

          <span>
            Attribute
          </span>

          <span>
            PDF
          </span>

          <span>
            CSV
          </span>

          <span>
            Status
          </span>

        </div>

        {comparisons.map(
          (item, index) => (

            <div
              className="tr"
              key={index}
            >

              <span className="attr-name">
                {formatAttribute(
                  item.attribute
                )}
              </span>

              <span>
                {item.pdf_value ||
                  "Not available"}
              </span>

              <span>
                {item.csv_value ||
                  "Not available"}
              </span>

              <span>

                <StatusBadge
                  status={
                    item.status
                  }
                />

              </span>

            </div>

          )
        )}

      </div>

    </section>
  );
}

/* ============================================
   STATUS BADGE
============================================ */

function StatusBadge({
  status,
}) {
  if (status === "match") {
    return (
      <span
        style={{
          color: "#15803d",
          fontWeight: 700,
        }}
      >
        ✓ Match
      </span>
    );
  }

  if (status === "conflict") {
    return (
      <span
        style={{
          color: "#dc2626",
          fontWeight: 700,
        }}
      >
        ⚠ Conflict
      </span>
    );
  }

  return (
    <span
      style={{
        color: "#d97706",
        fontWeight: 700,
      }}
    >
      ! Missing
    </span>
  );
}

/* ============================================
   RELIABILITY
============================================ */

function ReliabilityView({
  reliability,
}) {
  return (
    <section className="panel">

      <PanelTitle
        icon={
          <ShieldCheck size={18} />
        }
        title="Source Reliability"
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "15px",
        }}
      >

        {Object.entries(
          reliability || {}
        ).map(
          ([key, source]) => (

            <div
              key={key}
              style={{
                padding: "18px",
                border:
                  "1px solid #e5e7eb",
                borderRadius: "12px",
              }}
            >

              <strong>
                {source.label}
              </strong>

              <div
                style={{
                  marginTop: "12px",
                  fontSize: "26px",
                  fontWeight: 700,
                }}
              >
                {source.score}%
              </div>

              <div
                style={{
                  marginTop: "8px",
                  height: "8px",
                  background:
                    "#e5e7eb",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >

                <div
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        source.score
                      )
                    )}%`,
                    height: "100%",
                    background:
                      "#4f7ff0",
                  }}
                />

              </div>

            </div>

          )
        )}

      </div>

    </section>
  );
}

/* ============================================
   PRODUCT VIEW
============================================ */

function ProductView({
  analysis,
}) {
  return (
    <section className="panel">

      <PanelTitle
        icon={
          <FileText size={18} />
        }
        title="Product Intelligence"
      />

      <div className="product-title">

        <div>

          <h2>
            {analysis.product.product_name}
          </h2>

          <p>
            {analysis.product.category}
          </p>

        </div>

        <span
          className={`score-badge ${scoreClass(
            analysis.quality_score
          )}`}
        >
          {analysis.quality_score}/100
        </span>

      </div>

      <AttributeTable
        product={
          analysis.product
        }
      />

    </section>
  );
}

/* ============================================
   ATTRIBUTE TABLE
============================================ */

function AttributeTable({
  product,
}) {
  return (
    <section className="panel">

      <PanelTitle
        icon={
          <Search size={18} />
        }
        title="Extracted Attributes & Evidence"
      />

      <div className="table">

        <div className="tr header">

          <span>
            Attribute
          </span>

          <span>
            Value
          </span>

          <span>
            Confidence
          </span>

          <span>
            Evidence
          </span>

        </div>

        {(product.attributes || []).map(
          (a, index) => (

            <div
              className="tr"
              key={index}
            >

              <span className="attr-name">
                {a.name}
              </span>

              <span>
                {a.value}
              </span>

              <span>

                <div className="confidence">

                  <div className="bar">

                    <div
                      style={{
                        width: `${
                          a.confidence *
                          100
                        }%`,
                      }}
                    />

                  </div>

                  {Math.round(
                    a.confidence * 100
                  )}
                  %

                </div>

              </span>

              <span className="evidence">

                {a.source_page
                  ? `Page ${a.source_page}`
                  : "Not found"}

                {a.source_text && (
                  <small>
                    {a.source_text}
                  </small>
                )}

              </span>

            </div>

          )
        )}

      </div>

    </section>
  );
}

/* ============================================
   VALIDATION
============================================ */

function ValidationView({
  analysis,
}) {
  return (
    <section className="panel">

      <PanelTitle
        icon={
          <ShieldCheck size={18} />
        }
        title="AI Validation & Data Quality"
      />

      <div className="validation-score">

        <div
          className={`big-score ${scoreClass(
            analysis.quality_score
          )}`}
        >
          {analysis.quality_score}
        </div>

        <div>

          <strong>
            Product Data Quality Score
          </strong>

          <p>
            Combines category completeness,
            attribute confidence and critical
            validation penalties.
          </p>

        </div>

      </div>

      <div className="issues-list">

        {analysis.issues.length ===
        0 ? (
          <div className="success-row">

            <CheckCircle2
              size={20}
            />

            No validation issues found.

          </div>
        ) : (
          analysis.issues.map(
            (issue, i) => (

              <div
                className="issue-row"
                key={i}
              >

                {issue.severity ===
                "critical" ? (
                  <XCircle
                    size={20}
                  />
                ) : (
                  <AlertTriangle
                    size={20}
                  />
                )}

                <div>

                  <strong>
                    {issue.message}
                  </strong>

                  <span>
                    {issue.attribute ||
                      issue.code}
                  </span>

                  {issue.evidence && (
                    <small>
                      Evidence:{" "}
                      {issue.evidence}
                    </small>
                  )}

                </div>

              </div>

            )
          )
        )}

      </div>

    </section>
  );
}

/* ============================================
   ENRICHMENT
============================================ */

function EnrichmentView({
  product,
  enrichment,
  enrich,
  enriching,
}) {
  return (
    <section className="panel">

      <PanelTitle
        icon={
          <Sparkles size={18} />
        }
        title="AI Commerce Enrichment"
      />

      <p className="muted">
        Generation is restricted to
        verified product data to reduce
        unsupported claims.
      </p>

      <button
        className="primary enrichment-btn"
        onClick={enrich}
        disabled={enriching}
      >

        <Sparkles size={17} />

        {enriching
          ? "Generating..."
          : "Generate Commerce Content"}

      </button>

      {!enrichment ? (
        <div className="empty compact">

          <Sparkles size={34} />

          <h3>
            Ready to enrich
          </h3>

          <p>
            Generate description, feature
            bullets, applications and search
            keywords.
          </p>

        </div>
      ) : (
        <div className="enrichment-grid">

          <ContentBlock
            title="Product Description"
            text={
              enrichment.description
            }
          />

          <ListBlock
            title="Feature Bullets"
            items={
              enrichment.feature_bullets ||
              []
            }
          />

          <ListBlock
            title="Applications"
            items={
              enrichment.applications ||
              []
            }
          />

          <ListBlock
            title="Search Keywords"
            items={
              enrichment.search_keywords ||
              []
            }
          />

        </div>
      )}

    </section>
  );
}

/* ============================================
   CONTENT BLOCK
============================================ */

function ContentBlock({
  title,
  text,
}) {
  return (
    <div className="content-block">

      <h3>
        {title}
      </h3>

      <p>
        {text}
      </p>

    </div>
  );
}

/* ============================================
   LIST BLOCK
============================================ */

function ListBlock({
  title,
  items,
}) {
  return (
    <div className="content-block">

      <h3>
        {title}
      </h3>

      <ul>

        {items.map(
          (x, i) => (
            <li key={i}>
              {x}
            </li>
          )
        )}

      </ul>

    </div>
  );
}

/* ============================================
   METRIC
============================================ */

function Metric({
  title,
  value,
  cls,
}) {
  return (
    <div className="metric">

      <span>
        {title}
      </span>

      <strong className={cls}>
        {value}
      </strong>

    </div>
  );
}

/* ============================================
   PANEL TITLE
============================================ */

function PanelTitle({
  icon,
  title,
}) {
  return (
    <div className="panel-title">

      {icon}

      <h2>
        {title}
      </h2>

    </div>
  );
}

/* ============================================
   KEY VALUE
============================================ */

function KV({
  label,
  value,
}) {
  return (
    <div className="kv">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}

/* ============================================
   ISSUE BOX
============================================ */

function IssueBox({
  cls,
  icon,
  count,
  label,
}) {
  return (
    <div
      className={`issue-box ${cls}`}
    >

      {icon}

      <div>

        <strong>
          {count}
        </strong>

        <span>
          {label}
        </span>

      </div>

    </div>
  );
}

/* ============================================
   EMPTY STATE
============================================ */

function EmptyState({
  text,
}) {
  return (
    <section className="empty">

      <Search size={42} />

      <h2>
        No product analyzed yet
      </h2>

      <p>
        {text}
      </p>

    </section>
  );
}

/* ============================================
   FORMAT ATTRIBUTE
============================================ */

function formatAttribute(
  attribute
) {
  if (!attribute) return "";

  return attribute
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}