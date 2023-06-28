export const parsePositiveInteger = (str: string) => {
    const regex = /^[1-9][0-9]*$/; // Regular expression to match positive integers

    if (regex.test(str)) {
        const value = parseInt(str, 10);
        return {
            success: true,
            value: value
        };
    }
    else {
        return {
            success: false
        };
    }
}