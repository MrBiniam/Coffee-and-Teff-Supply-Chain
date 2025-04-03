export class Order{
        id: number;
        quantity: string;
        status: string
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
                imageFileName?: string; // Added for storing extracted image filename
            }
        ];
        driver: number;
        buyer: number;
}