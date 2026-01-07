export class ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;

    constructor(data: T, message = 'OK', success = true) {
        this.success = success;
        this.message = message;
        // if (data !== undefined && data !== null && data != '') {
        this.data = data;
        // }
    }
}