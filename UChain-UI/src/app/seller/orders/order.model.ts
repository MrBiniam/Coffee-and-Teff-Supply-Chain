export class Order{
        id: number;
        quantity: string;
        status: string
        order_date: Date;
        accepted_date?: Date; // Optional field for when an order was accepted
        shipped_date?: Date;  // Optional field for when an order was shipped
        updated_at?: Date;    // Optional field for when an order was last updated
        acceptedTimestamp?: number; // Added field for sorting by acceptance time
        product: [
            {
                id: number;
                name: string;
                description: string;
                location: string;
                seller: number;
                price: number;
                quantity: string;
                product_type: string;
                image: string;
            }
        ];
        driver: number;
        buyer: number;
        // Additional properties for UI display
        buyerName?: string;
        buyerImageUrl?: string;
}