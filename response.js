const response = (statusCode, data, messages, res) => {
  res.status(statusCode).json({
    status: statusCode,
    data: data,
    message: messages
  })
}


module.exports = response