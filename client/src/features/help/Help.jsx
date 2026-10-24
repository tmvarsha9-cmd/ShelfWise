import PageHeader from "../../components/PageHeader";

export default function Help() {
  return (
    <div className="max-w-4xl space-y-8">
      <PageHeader
        title="Help & Guides"
        description="Plain language instructions and glossary for shop staff and store operators."
      />

      {/* Guide 1: How to record a sale */}
      <section className="bg-surface border border-border rounded-card p-6">
        <h2 className="text-[18px] font-semibold text-text mb-2">How to record a sale</h2>
        <p className="text-[14px] text-text-muted leading-relaxed mb-4">
          Whenever a customer buys an item or stock is issued from the shelf:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-[14px] text-text">
          <li>
            Click the green <strong>"Record a sale"</strong> button located at the top right of any screen.
          </li>
          <li>Search for the item by typing its name or scanning/typing its item code.</li>
          <li>Enter or step the quantity sold. The screen tells you right away how many units will remain.</li>
          <li>If selling multiple products in one transaction, click <strong>"Add another item"</strong>.</li>
          <li>Click <strong>"Record sale"</strong> to finalize. Physical stock is updated immediately.</li>
        </ol>
      </section>

      {/* Guide 2: How to receive a delivery */}
      <section className="bg-surface border border-border rounded-card p-6">
        <h2 className="text-[18px] font-semibold text-text mb-2">How to receive a delivery</h2>
        <p className="text-[14px] text-text-muted leading-relaxed mb-4">
          Remember: <em>An order is not stock until the goods are received.</em>
        </p>
        <ol className="list-decimal list-inside space-y-2 text-[14px] text-text">
          <li>
            Click <strong>"Receive stock"</strong> in the top bar or inside an open purchase order.
          </li>
          <li>Select the supplier's purchase order to automatically fill in expected items and agreed unit costs.</li>
          <li>Verify the quantity physically unloaded and enter batch codes or expiry dates for perishables.</li>
          <li>Click <strong>"Confirm receipt & update stock"</strong>. This adds the items directly into active shop inventory.</li>
        </ol>
      </section>

      {/* Guide 3: How to read stock advice */}
      <section className="bg-surface border border-border rounded-card p-6">
        <h2 className="text-[18px] font-semibold text-text mb-2">How to read stock advice</h2>
        <p className="text-[14px] text-text-muted leading-relaxed mb-4">
          Stock advice calculates future inventory coverage based on recent sales rates and supplier delivery times.
        </p>
        <ul className="list-disc list-inside space-y-2 text-[14px] text-text">
          <li>
            <strong>High risk:</strong> Current stock will run out before a fresh order could arrive from the supplier.
          </li>
          <li>
            <strong>Reorder within N days:</strong> Tells you exactly when an order must be placed so goods arrive before stock hits zero.
          </li>
          <li>
            <strong>Explain this:</strong> Generates a plain-text breakdown of why this quantity was suggested.
          </li>
          <li>
            <strong>Show calculation:</strong> Reveals every variable (safety stock, lead time, daily demand) used to reach the recommendation.
          </li>
        </ul>
      </section>

      {/* Glossary */}
      <section className="bg-surface border border-border rounded-card p-6">
        <h2 className="text-[18px] font-semibold text-text mb-4 pb-2 border-b border-border">
          Glossary of terms
        </h2>

        <dl className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[14px]">
          <div>
            <dt className="font-semibold text-text mb-1">Days left</dt>
            <dd className="text-text-muted leading-relaxed">
              How many days current on-hand stock will last if recent sales continue at the same rate.
            </dd>
          </div>

          <div>
            <dt className="font-semibold text-text mb-1">Reorder point</dt>
            <dd className="text-text-muted leading-relaxed">
              The threshold where a new purchase order should be triggered. Calculated as: (daily demand × delivery time) + safety stock buffer.
            </dd>
          </div>

          <div>
            <dt className="font-semibold text-text mb-1">Safety stock</dt>
            <dd className="text-text-muted leading-relaxed">
              A reserve buffer of units kept on hand to safeguard against sudden sales spikes or delivery delays.
            </dd>
          </div>

          <div>
            <dt className="font-semibold text-text mb-1">Delivery time (days)</dt>
            <dd className="text-text-muted leading-relaxed">
              The number of calendar days between sending a purchase order to a supplier and receiving the delivery at the shop.
            </dd>
          </div>

          <div>
            <dt className="font-semibold text-text mb-1">Expiry risk</dt>
            <dd className="text-text-muted leading-relaxed">
              Estimated units of perishable stock that might not sell before their expiration date based on current daily demand.
            </dd>
          </div>

          <div>
            <dt className="font-semibold text-text mb-1">How you get it</dt>
            <dd className="text-text-muted leading-relaxed">
              Whether the item is <strong>Bought from a supplier</strong> (external vendor delivery) or <strong>Made in-house</strong> (produced in the shop from raw materials).
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
