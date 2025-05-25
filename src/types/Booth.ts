export type Booth = {
    id: number;
    circle: string;
    attendance: {
        day: number;
        location: string;
        isBorrowed: boolean;
    }[];
    coverImageName?: string;
    links: {
        name: string;
        category: string;
        url: string;
    }[];
    tags: string[];
}