export function getBoolean(val) {
  console.log(val);
  return !!JSON.parse(String(val).toLowerCase());
}

export const ResponseSuccessData = (message: string | Object) => {
  return {
    statusCode: 200,
    message: message,
    status: true,
  };
};
