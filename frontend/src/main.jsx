import React, { useState } from "react";
import { createRoot } from "react-dom/client";

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
  GitCompare,
  BadgeCheck
} from "lucide-react";

import "./styles.css";

const API = "https://productmind-ai-backend-as6m.onrender.com";

function scoreClass(score) {
  if (score >= 90) return "good";
  if (score >= 70) return "warn";
  return "bad";
}

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [csvFile, setCsvFile] = useState(null);

  const [analysis, setAnalysis] = useState(null);
  const [multiSource, setMultiSource] = useState(null);
  const [enrichment, setEnrichment] = useState(null);

  const [loading, setLoading] = useState(false);
  const [enriching, setEnriching] = useState(false);

  const [error, setError] = useState("");

  const [active, setActive] = useState("dashboard");

  async function analyzeSources() {
    if (!pdfFile || !csvFile) {
      setError("Please select both the PDF and CSV files.");
      return;
    }

    setLoading(true);
    setError("");
    setMultiSource(null);
    setEnrichment(null);

    try {
      const form = new FormData();

      form.append("pdf_file", pdfFile);
      form.append("csv_file", csvFile);

      const response = await fetch(
        `${API}/api/analyze-multi-source`,
        {
          method: "POST",
          body: form
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Multi-source analysis failed."
        );
      }

      setMultiSource(data);
      setAnalysis(data);
      setActive("dashboard");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function enrichProduct() {
    if (!multiSource?.product) {
      setError("Analyze the product first.");
      return;
    }

    setEnriching(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/api/enrich`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(multiSource.product)
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
      setError(err.message);
    } finally {
      setEnriching(false);
    }
  }

  return (
    <div className="app">

      {/* HEADER */}
      <header className="topbar">

        <div className="brand">

          <div className="brand-mark">
            P
          </div>

          <div>
            <strong>ProductMind AI</strong>
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


      <div className="layout">

        {/* SIDEBAR */}
        <aside className="sidebar">

          <nav>

            <NavButton
              active={active === "dashboard"}
              onClick={() => setActive("dashboard")}
              icon={<Database size={18} />}
              text="Dashboard"
            />

            <NavButton
              active={active === "product"}
              onClick={() => setActive("product")}
              icon={<FileText size={18} />}
              text="Product Intelligence"
            />

            <NavButton
              active={active === "validation"}
              onClick={() => setActive("validation")}
              icon={<ShieldCheck size={18} />}
              text="Validation"
            />

            <NavButton
              active={active === "conflicts"}
              onClick={() => setActive("conflicts")}
              icon={<GitCompare size={18} />}
              text="Source Conflicts"
            />

            <NavButton
              active={active === "enrichment"}
              onClick={() => setActive("enrichment")}
              icon={<Sparkles size={18} />}
              text="AI Enrichment"
            />

            <NavButton
              active={active === "verified"}
              onClick={() => setActive("verified")}
              icon={<BadgeCheck size={18} />}
              text="Verified Product"
            />

          </nav>


          <div className="sidebar-card">

            <div className="mini-label">
              UniHack MVP
            </div>

            Fragmented product information
            → trusted commerce-ready intelligence.

          </div>

        </aside>


        {/* MAIN */}
        <main className="content">

          <div className="page-head">

            <div className="eyebrow">
              PRODUCT INTELLIGENCE ENGINE
            </div>

            <h1>
              Turn messy product data into trusted intelligence.
            </h1>

            <p>
              Upload an industrial technical document and
              catalog. ProductMind extracts, validates,
              compares, explains and enriches product data.
            </p>

          </div>


          {/* ERROR */}
          {error && (
            <div className="error">
              <XCircle size={18} />
              {error}
            </div>
          )}


          {/* UPLOAD */}
          <section className="upload-card">

            <div className="upload-icon">
              <Upload size={24} />
            </div>

            <div className="upload-copy">

              <h2>
                Analyze product sources
              </h2>

              <p>
                Upload a manufacturer datasheet and
                product catalog to detect inconsistencies.
              </p>


              <div className="file-row">

                <label className="file-picker">

                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) =>
                      setPdfFile(
                        e.target.files?.[0] || null
                      )
                    }
                  />

                  <FileText size={17} />

                  {pdfFile
                    ? pdfFile.name
                    : "Choose PDF"}

                </label>


                <label className="file-picker">

                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) =>
                      setCsvFile(
                        e.target.files?.[0] || null
                      )
                    }
                  />

                  <Database size={17} />

                  {csvFile
                    ? csvFile.name
                    : "Choose CSV"}

                </label>

              </div>

            </div>


            <button
              className="primary"
              onClick={analyzeSources}
              disabled={
                !pdfFile ||
                !csvFile ||
                loading
              }
            >

              {loading
                ? "Analyzing..."
                : "Analyze Sources"}

              {!loading && (
                <ChevronRight size={17} />
              )}

            </button>

          </section>


          {/* DASHBOARD */}
          {active === "dashboard" && (

            multiSource ? (

              <Dashboard
                analysis={multiSource}
              />

            ) : (

              <EmptyState
                text="Upload a PDF and CSV above to create your first verified product record."
              />

            )

          )}


          {/* PRODUCT */}
          {active === "product" && (

            multiSource ? (
              <ProductView
                analysis={multiSource}
              />
            ) : (
              <EmptyState
                text="Analyze a product first."
              />
            )

          )}


          {/* VALIDATION */}
          {active === "validation" && (

            multiSource ? (
              <ValidationView
                analysis={multiSource}
              />
            ) : (
              <EmptyState
                text="Analyze a product first."
              />
            )

          )}


          {/* CONFLICTS */}
          {active === "conflicts" && (

            multiSource ? (
              <ConflictView
                analysis={multiSource}
              />
            ) : (
              <EmptyState
                text="Analyze product sources first."
              />
            )

          )}


          {/* ENRICHMENT */}
          {active === "enrichment" && (

            multiSource ? (

              <EnrichmentView
                product={multiSource.product}
                enrichment={enrichment}
                enrich={enrichProduct}
                enriching={enriching}
              />

            ) : (

              <EmptyState
                text="Analyze a product first."
              />

            )

          )}


          {/* VERIFIED */}
          {active === "verified" && (

            multiSource ? (

              <VerifiedProduct
                analysis={multiSource}
                enrichment={enrichment}
              />

            ) : (

              <EmptyState
                text="Analyze a product first."
              />

            )

          )}

        </main>

      </div>

    </div>
  );
}


/* -------------------------------------------------- */
/* NAVIGATION */
/* -------------------------------------------------- */

function NavButton({
  active,
  onClick,
  icon,
  text
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

      <span>
        {text}
      </span>

    </button>

  );
}


/* -------------------------------------------------- */
/* DASHBOARD */
/* -------------------------------------------------- */

function Dashboard({ analysis }) {

  const p = analysis.product;

  return (

    <>

      <section className="metric-grid">

        <Metric
          title="Consistency"
          value={`${analysis.consistency_score}%`}
          cls={scoreClass(
            analysis.consistency_score
          )}
        />

        <Metric
          title="Sources"
          value={analysis.source_count}
          cls="good"
        />

        <Metric
          title="Attributes Compared"
          value={analysis.total_compared}
          cls="good"
        />

        <Metric
          title="Conflicts"
          value={analysis.conflict_count}
          cls={
            analysis.conflict_count
              ? "warn"
              : "good"
          }
        />

      </section>


      <section className="two-col">

        <div className="panel">

          <PanelTitle
            icon={<FileText size={18} />}
            title="Canonical Product"
          />

          <ProductHeader
            analysis={analysis}
          />

        </div>


        <div className="panel">

          <PanelTitle
            icon={<ShieldCheck size={18} />}
            title="Source Reliability"
          />

          <Reliability
            analysis={analysis}
          />

        </div>

      </section>


      <AttributeTable
        product={p}
      />

    </>

  );
}


/* -------------------------------------------------- */
/* PRODUCT VIEW */
/* -------------------------------------------------- */

function ProductView({ analysis }) {

  return (

    <section className="panel">

      <PanelTitle
        icon={<FileText size={18} />}
        title="Product Intelligence"
      />

      <ProductHeader
        analysis={analysis}
      />

      <AttributeTable
        product={analysis.product}
      />

    </section>

  );

}


/* -------------------------------------------------- */
/* PRODUCT HEADER */
/* -------------------------------------------------- */

function ProductHeader({ analysis }) {

  const p = analysis.product;

  return (

    <>

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
          className={
            `score-badge ${scoreClass(
              analysis.consistency_score
            )}`
          }
        >
          {analysis.consistency_score}/100
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
          label="Sources"
          value={
            analysis.source_count
          }
        />

        <KV
          label="Attributes Compared"
          value={
            analysis.total_compared
          }
        />

      </div>

    </>

  );

}


/* -------------------------------------------------- */
/* ATTRIBUTE TABLE */
/* -------------------------------------------------- */

function AttributeTable({
  product
}) {

  return (

    <section className="panel">

      <PanelTitle
        icon={<Search size={18} />}
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


        {product.attributes.map(
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
                        width:
                          `${a.confidence * 100}%`
                      }}
                    />

                  </div>

                  {Math.round(
                    a.confidence * 100
                  )}%

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


/* -------------------------------------------------- */
/* VALIDATION */
/* -------------------------------------------------- */

function ValidationView({
  analysis
}) {

  return (

    <section className="panel">

      <PanelTitle
        icon={<ShieldCheck size={18} />}
        title="AI Validation & Data Quality"
      />


      <div className="validation-score">

        <div
          className={
            `big-score ${scoreClass(
              analysis.consistency_score
            )}`
          }
        >

          {analysis.consistency_score}

        </div>


        <div>

          <strong>
            Cross-source consistency score
          </strong>

          <p>
            Measures how consistently product
            attributes agree across the PDF and
            catalog CSV.
          </p>

        </div>

      </div>


      <div className="issues-list">

        {analysis.conflict_count === 0 ? (

          <div className="success-row">

            <CheckCircle2 size={20} />

            No source conflicts found.

          </div>

        ) : (

          analysis.conflicts.map(
            (conflict, index) => (

              <div
                className="issue-row"
                key={index}
              >

                <AlertTriangle
                  size={20}
                />

                <div>

                  <strong>
                    {conflict.attribute}
                  </strong>

                  <span>
                    PDF: {conflict.pdf_value}
                    {" · "}
                    CSV: {conflict.csv_value}
                  </span>

                  <small>
                    Severity:
                    {" "}
                    {conflict.severity}
                  </small>

                </div>

              </div>

            )
          )

        )}

      </div>

    </section>

  );

}


/* -------------------------------------------------- */
/* CONFLICTS */
/* -------------------------------------------------- */

function ConflictView({
  analysis
}) {

  return (

    <section className="panel">

      <PanelTitle
        icon={<GitCompare size={18} />}
        title="Source Conflicts"
      />

      <p className="muted">

        ProductMind compares information across
        independent sources and highlights
        inconsistent product attributes.

      </p>


      {analysis.conflict_count === 0 ? (

        <div className="success-row">

          <CheckCircle2 size={20} />

          No conflicts detected.

        </div>

      ) : (

        analysis.conflicts.map(
          (conflict, index) => (

            <ConflictCard
              key={index}
              conflict={conflict}
              analysis={analysis}
            />

          )
        )

      )}

    </section>

  );

}


/* -------------------------------------------------- */
/* CONFLICT CARD */
/* -------------------------------------------------- */

function ConflictCard({
  conflict,
  analysis
}) {

  const pdfReliability =
    analysis.source_reliability
      ?.manufacturer_datasheet
      ?.score || 95;

  const csvReliability =
    analysis.source_reliability
      ?.user_csv
      ?.score || 70;

  const pdfPreferred =
    pdfReliability >= csvReliability;

  const recommended =
    pdfPreferred
      ? conflict.pdf_value
      : conflict.csv_value;

  const preferredSource =
    pdfPreferred
      ? "Manufacturer Datasheet"
      : "Product Catalog CSV";

  const preferredScore =
    pdfPreferred
      ? pdfReliability
      : csvReliability;

  const conflictingValue =
    pdfPreferred
      ? conflict.csv_value
      : conflict.pdf_value;

  return (

    <div className="conflict-card">

      <div className="conflict-heading">

        <AlertTriangle
          size={22}
        />

        <div>

          <h2>
            {conflict.severity.toUpperCase()}
            {" "}
            CONFLICT
          </h2>

          <p>
            Conflicting product information
            detected across sources
          </p>

        </div>

        <span className="verified-pill">
          <CheckCircle2 size={15} />
          Verified
        </span>

      </div>


      <h2 className="conflict-attribute">
        {formatAttribute(
          conflict.attribute
        )}
      </h2>


      <div className="source-comparison">

        <SourceCard
          title="MANUFACTURER DATASHEET"
          value={conflict.pdf_value}
          score={pdfReliability}
          preferred={pdfPreferred}
        />


        <div className="vs">
          VS
        </div>


        <SourceCard
          title="PRODUCT CATALOG CSV"
          value={conflict.csv_value}
          score={csvReliability}
          preferred={!pdfPreferred}
        />

      </div>


      <div className="resolution">

        <div className="resolution-title">

          <CheckCircle2 size={22} />

          <div>

            <h3>
              Explainable Resolution
            </h3>

            <p>
              Recommended value based on
              source authority
            </p>

          </div>

        </div>


        <div className="recommended">

          <span>
            RECOMMENDED VALUE
          </span>

          <strong>
            {recommended}
          </strong>

        </div>


        <div className="resolution-grid">

          <KV
            label="Preferred Source"
            value={preferredSource}
          />

          <KV
            label="Authority Score"
            value={`${preferredScore}%`}
          />

          <KV
            label="Conflicting Value"
            value={conflictingValue}
          />

        </div>


        <div className="why">

          <h4>
            Why this value?
          </h4>

          <p>

            The{" "}
            <strong>
              {preferredSource}
            </strong>{" "}
            has a higher source-authority
            score of{" "}
            <strong>
              {preferredScore}%
            </strong>
            {" "}and is therefore selected as
            the preferred value.

          </p>

          <p>

            ProductMind recommends{" "}
            <strong>
              {recommended}
            </strong>
            {" "}while flagging the discrepancy
            for human verification before
            publication.

          </p>

        </div>


        <div className="verified-row">

          <CheckCircle2 size={28} />

          <div>

            <strong>
              Product attribute verified
            </strong>

            <span>

              {formatAttribute(
                conflict.attribute
              )}
              :{" "}
              {recommended}
              {" "}approved from{" "}
              {preferredSource}.

            </span>

          </div>

          <b>
            VERIFIED
          </b>

        </div>

      </div>

    </div>

  );

}


/* -------------------------------------------------- */
/* SOURCE CARD */
/* -------------------------------------------------- */

function SourceCard({
  title,
  value,
  score,
  preferred
}) {

  return (

    <div
      className={
        preferred
          ? "source-card preferred"
          : "source-card"
      }
    >

      {preferred && (

        <span className="preferred-label">

          <CheckCircle2 size={14} />

          Preferred Source

        </span>

      )}


      <span className="source-name">
        {title}
      </span>

      <strong className="source-value">
        {value}
      </strong>


      <div className="authority">

        <span>
          Source authority
        </span>

        <b>
          {score}%
        </b>

      </div>


      <div className="authority-bar">

        <div
          style={{
            width: `${score}%`
          }}
        />

      </div>

    </div>

  );

}


/* -------------------------------------------------- */
/* RELIABILITY */
/* -------------------------------------------------- */

function Reliability({
  analysis
}) {

  const reliability =
    analysis.source_reliability || {};

  return (

    <div className="reliability">

      {Object.entries(
        reliability
      ).map(
        ([key, source]) => (

          <div
            className="reliability-row"
            key={key}
          >

            <span>
              {source.label}
            </span>

            <strong>
              {source.score}%
            </strong>

          </div>

        )
      )}

    </div>

  );

}


/* -------------------------------------------------- */
/* ENRICHMENT */
/* -------------------------------------------------- */

function EnrichmentView({
  product,
  enrichment,
  enrich,
  enriching
}) {

  return (

    <section className="panel">

      <PanelTitle
        icon={<Sparkles size={18} />}
        title="AI Commerce Enrichment"
      />

      <p className="muted">

        Generation is restricted to verified
        product data to reduce unsupported claims.

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
            text={enrichment.description}
          />

          <ListBlock
            title="Feature Bullets"
            items={
              enrichment.feature_bullets
            }
          />

          <ListBlock
            title="Applications"
            items={
              enrichment.applications
            }
          />

          <ListBlock
            title="Search Keywords"
            items={
              enrichment.search_keywords
            }
          />

        </div>

      )}

    </section>

  );

}


/* -------------------------------------------------- */
/* VERIFIED PRODUCT */
/* -------------------------------------------------- */

function VerifiedProduct({
  analysis,
  enrichment
}) {

  const product =
    analysis.product;

  return (

    <>

      <section className="verified-hero">

        <div>

          <div className="eyebrow">
            VERIFIED PRODUCT RECORD
          </div>

          <h1>
            {product.product_name}
          </h1>

          <p>
            {product.manufacturer}
            {" "}
            · Model {product.model}
          </p>

        </div>


        <div className="verified-main-badge">

          <BadgeCheck size={22} />

          VERIFIED

        </div>

      </section>


      <section className="metric-grid">

        <Metric
          title="Consistency"
          value={`${analysis.consistency_score}%`}
          cls={scoreClass(
            analysis.consistency_score
          )}
        />

        <Metric
          title="Sources"
          value={analysis.source_count}
          cls="good"
        />

        <Metric
          title="Matches"
          value={analysis.matches}
          cls="good"
        />

        <Metric
          title="Conflicts"
          value={analysis.conflict_count}
          cls={
            analysis.conflict_count
              ? "warn"
              : "good"
          }
        />

      </section>


      {/* VERIFIED ATTRIBUTES */}
      <section className="panel">

        <PanelTitle
          icon={<BadgeCheck size={18} />}
          title="Verified Product Data"
        />

        <div className="verified-attributes">

          {product.attributes.map(
            (attribute, index) => {

              const conflict =
                analysis.conflicts.find(
                  c =>
                    c.attribute ===
                    attribute.name
                );

              const verifiedValue =
                conflict
                  ? conflict.pdf_value
                  : attribute.value;

              return (

                <div
                  className="verified-attribute"
                  key={index}
                >

                  <div>

                    <span>
                      {formatAttribute(
                        attribute.name
                      )}
                    </span>

                    <strong>
                      {verifiedValue}
                    </strong>

                  </div>

                  <BadgeCheck
                    size={20}
                  />

                </div>

              );

            }
          )}

        </div>

      </section>


      {/* SOURCE TRACEABILITY */}
      <section className="panel">

        <PanelTitle
          icon={<Database size={18} />}
          title="Source Traceability"
        />

        <Reliability
          analysis={analysis}
        />

      </section>


      {/* CONFLICT SUMMARY */}
      <section className="panel">

        <PanelTitle
          icon={<GitCompare size={18} />}
          title="Conflict Resolution"
        />

        {analysis.conflict_count === 0 ? (

          <div className="success-row">

            <CheckCircle2 size={20} />

            No conflicts required resolution.

          </div>

        ) : (

          analysis.conflicts.map(
            (conflict, index) => (

              <div
                className="verified-conflict"
                key={index}
              >

                <div>

                  <span>
                    {formatAttribute(
                      conflict.attribute
                    )}
                  </span>

                  <strong>
                    {conflict.pdf_value}
                  </strong>

                </div>

                <div>

                  <small>
                    Conflicting CSV value
                  </small>

                  <strong>
                    {conflict.csv_value}
                  </strong>

                </div>

                <BadgeCheck
                  size={22}
                />

              </div>

            )
          )

        )}

      </section>


      {/* ENRICHMENT */}
      <section className="panel">

        <PanelTitle
          icon={<Sparkles size={18} />}
          title="Commerce Content"
        />


        {!enrichment ? (

          <div className="empty compact">

            <Sparkles size={30} />

            <h3>
              Commerce content not generated
            </h3>

            <p>
              Open AI Enrichment to generate
              verified commerce content.
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
                enrichment.feature_bullets
              }
            />

            <ListBlock
              title="Applications"
              items={
                enrichment.applications
              }
            />

            <ListBlock
              title="Search Keywords"
              items={
                enrichment.search_keywords
              }
            />

          </div>

        )}

      </section>

    </>

  );

}


/* -------------------------------------------------- */
/* HELPERS */
/* -------------------------------------------------- */

function formatAttribute(
  value
) {

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, c =>
      c.toUpperCase()
    );

}


function ContentBlock({
  title,
  text
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


function ListBlock({
  title,
  items
}) {

  return (

    <div className="content-block">

      <h3>
        {title}
      </h3>

      <ul>

        {items.map(
          (item, index) => (

            <li key={index}>
              {item}
            </li>

          )
        )}

      </ul>

    </div>

  );

}


function Metric({
  title,
  value,
  cls
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


function PanelTitle({
  icon,
  title
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


function KV({
  label,
  value
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


function EmptyState({
  text
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


createRoot(
  document.getElementById("root")
).render(
  <App />
);