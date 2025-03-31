export class Order{
        id: number;
        quantity: string;
        status: string;
        order_date: Date;
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
        numberOfRating: number;
        userRating: number;
        rating: any[];
        shipped_date?: Date;
        accepted_date?: Date;
        delivered_date?: Date;
        updated_at?: Date;
        acceptedTimestamp?: number; // For sorting orders by acceptance time
        seller_name?: string;
        buyer_name?: string;
        driver_name?: string;
        seller_username?: string;
        buyer_username?: string;
        driver_username?: string;
        accepted_by?: number; // Person who accepted the order
        seller_accepted?: boolean; // Whether seller accepted the order
}