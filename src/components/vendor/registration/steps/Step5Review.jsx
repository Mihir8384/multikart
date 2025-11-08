"use client";

export default function Step5Review({ onSubmit, registrationData }) {
  const store = registrationData || {};

  return (
    <div className="row g-3">
      <div className="col-12">
        <h5>Review Your Details</h5>
      </div>

      <div className="col-12">
        <div className="card p-3">
          <h6 className="mb-2">Store</h6>
          <div>
            Store Name: <strong>{store.store_name || "-"}</strong>
          </div>
          <div>
            Vendor ID: <strong>{store.vendor_id || "-"}</strong>
          </div>
          <hr />
          <h6 className="mb-2">Business</h6>
          <div>
            Type: <strong>{store.business?.type || "-"}</strong>
          </div>
          <div>
            Name: <strong>{store.business?.name || "-"}</strong>
          </div>
          <div>
            Reg No:{" "}
            <strong>{store.business?.registration_number || "-"}</strong>
          </div>
          <div>
            Tax ID: <strong>{store.business?.tax_id || "-"}</strong>
          </div>
          <hr />
          <h6 className="mb-2">Contacts</h6>
          <div>
            Primary: <strong>{store.contacts?.primary?.name || "-"}</strong> |{" "}
            {store.contacts?.primary?.email || "-"}
          </div>
          <div>
            Orders: <strong>{store.contacts?.orders?.name || "-"}</strong> |{" "}
            {store.contacts?.orders?.email || "-"}
          </div>
          <div>
            Payout: <strong>{store.contacts?.payout?.name || "-"}</strong> |{" "}
            {store.contacts?.payout?.email || "-"}
          </div>
          <hr />
          <h6 className="mb-2">Warehouses</h6>
          {(store.warehouses || []).map((w, i) => (
            <div key={i} className="mb-1">
              - {w.name} [{w.city}, {w.country}]{" "}
              {w.is_active ? "(Active)" : "(Inactive)"}{" "}
            </div>
          ))}
          <hr />
          <h6 className="mb-2">Channels</h6>
          {(store.channels || []).map((c, i) => (
            <div key={i} className="mb-1">
              - {c.type} {c.handle ? `(${c.handle})` : ""}{" "}
              {c.url ? `- ${c.url}` : ""}
            </div>
          ))}
          <hr />
          <h6 className="mb-2">Payout</h6>
          <div>
            Bank: <strong>{store.payout?.bank_name || "-"}</strong>
          </div>
          <div>
            Account: <strong>{store.payout?.account_number || "-"}</strong>
          </div>
          <div>
            Holder: <strong>{store.payout?.account_holder_name || "-"}</strong>
          </div>
        </div>
      </div>

      <div className="col-12 d-flex gap-2">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => history.back()}
        >
          Back
        </button>
        <button
          type="button"
          className="btn btn-success"
          onClick={() => onSubmit({ confirm: true })}
        >
          Submit Application
        </button>
      </div>
    </div>
  );
}
