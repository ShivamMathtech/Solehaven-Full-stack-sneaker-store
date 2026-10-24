import { useState } from "react";
import { useStore } from "../lib/store";
import type { Address } from "../types";
import { ErrorText, Modal } from "./UI";
export function AddressForm({
  address,
  onClose,
}: {
  address?: Address;
  onClose: () => void;
}) {
  const { state, dispatch, toast } = useStore();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      title={address ? "Edit your address" : "A place to call home"}
      onClose={onClose}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const form = new FormData(e.currentTarget);
          try {
            await dispatch({
              type: "saveAddress",
              payload: {
                ...Object.fromEntries(form),
                id: address?.id,
                isDefault: form.get("isDefault") === "on",
              },
            });
            toast("Address saved");
            onClose();
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="form-grid">
          <label>
            Address label
            <input
              required
              name="label"
              maxLength={30}
              defaultValue={address?.label || "Home"}
              placeholder="Home, office…"
            />
          </label>
          <label>
            Recipient name
            <input
              required
              name="name"
              minLength={2}
              maxLength={80}
              autoComplete="name"
              defaultValue={address?.name || state?.profile.name}
            />
          </label>
          <label className="span-2">
            Street address
            <input
              required
              name="line1"
              minLength={4}
              maxLength={180}
              autoComplete="street-address"
              defaultValue={address?.line1}
              placeholder="House number and street"
            />
          </label>
          <label>
            City
            <input
              required
              name="city"
              minLength={2}
              maxLength={80}
              autoComplete="address-level2"
              defaultValue={address?.city}
            />
          </label>
          <label>
            State / region
            <input
              required
              name="region"
              minLength={2}
              maxLength={80}
              autoComplete="address-level1"
              defaultValue={address?.region}
            />
          </label>
          <label>
            Postal code
            <input
              required
              name="postalCode"
              minLength={2}
              maxLength={20}
              autoComplete="postal-code"
              defaultValue={address?.postalCode}
            />
          </label>
          <label>
            Country
            <input
              required
              name="country"
              minLength={2}
              maxLength={80}
              autoComplete="country-name"
              defaultValue={address?.country || "United States"}
            />
          </label>
          <label className="span-2">
            Phone number
            <input
              required
              type="tel"
              name="phone"
              minLength={5}
              maxLength={30}
              autoComplete="tel"
              defaultValue={address?.phone || state?.profile.phone}
              placeholder="For delivery updates"
            />
          </label>
        </div>
        <label className="check-line">
          <input
            type="checkbox"
            name="isDefault"
            defaultChecked={address?.isDefault || !state?.addresses.length}
          />
          Make this my default address
        </label>
        <ErrorText error={error} />
        <button type="submit" disabled={busy} className="btn primary full">
          {busy ? "Saving…" : "Save address"}
        </button>
      </form>
    </Modal>
  );
}
