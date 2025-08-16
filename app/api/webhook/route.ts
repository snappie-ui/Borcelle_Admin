/* eslint-disable @typescript-eslint/no-explicit-any */
import Customer from "@/lib/models/Customer";
import Order from "@/lib/models/Order";
import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

export const POST = async (req: NextRequest) => {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("Stripe-Signature") as string;

    // Verify the webhook signature to ensure the request is from Stripe
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // Use a switch statement to handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;

        const customerInfo = {
          clerkId: session?.client_reference_id,
          name: session?.customer_details?.name,
          email: session?.customer_details?.email,
        };

        const shippingAddress = {
        street: (session as any)?.shipping_details?.address?.line1,
        city: (session as any)?.shipping_details?.address?.city,
        state: (session as any)?.shipping_details?.address?.state,
        postalCode: (session as any)?.shipping_details?.address?.postal_code,
        country: (session as any)?.shipping_details?.address?.country,
};


        // Retrieve the full session object to get line items
        const retrieveSession = await stripe.checkout.sessions.retrieve(
          session.id,
          { expand: ["line_items.data.price.product"] }
        );

        const lineItems = retrieveSession?.line_items?.data;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orderItems = lineItems?.map((item: any) => {
          return {
            product: item.price.product.metadata.productId,
            color: item.price.product.metadata.color || "N/A",
            size: item.price.product.metadata.size || "N/A",
            quantity: item.quantity,
          };
        });

        await connectToDB();

        // Create a new order in the database
        const newOrder = new Order({
          customerClerkId: customerInfo.clerkId,
          products: orderItems,
          shippingAddress,
          shippingRate: session?.shipping_cost?.shipping_rate,
          totalAmount: session.amount_total ? session.amount_total / 100 : 0,
        });

        await newOrder.save();

        // Find or create a customer and associate the order with them
        let customer = await Customer.findOne({ clerkId: customerInfo.clerkId });

        if (customer) {
          customer.orders.push(newOrder._id);
        } else {
          customer = new Customer({
            ...customerInfo,
            orders: [newOrder._id],
          });
        }

        await customer.save();
        console.log("✅ Successfully processed checkout.session.completed");
        break;

      // --- Add other webhook events you want to handle here ---

      case "payment_intent.succeeded":
        // Handle successful payment intents
        console.log("PaymentIntent was successful!", event.data.object);
        break;

      case "invoice.payment_succeeded":
        // Handle successful subscription payments
        console.log("Invoice payment was successful!", event.data.object);
        break;

      default:
        // Unexpected event type
        console.warn(`🤷‍♀️ Unhandled event type: ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    return new NextResponse("Webhook received successfully", { status: 200 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    // It's important to catch errors and log them, but still return a 200
    // response to Stripe if the issue is on our end, to prevent retries.
    // A 400-level error should be returned for issues with the request itself (e.g., bad signature).
    if (err instanceof Stripe.errors.StripeSignatureVerificationError) {
      console.error("[webhook_SIGNATURE_ERROR]", err.message);
      return new NextResponse(`Webhook signature error: ${err.message}`, { status: 400 });
    }
    
    console.error("[webhook_POST_ERROR]", err);
    return new NextResponse("Failed to process webhook", { status: 500 });
  }
};