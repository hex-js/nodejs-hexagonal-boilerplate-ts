# this file is for output members

output "aws_sqs_todo_queue_url" {
  value = aws_sqs_queue.todo_queue.id
}


output "aws_dynamodb_todo_id" {
  value = aws_dynamodb_table.todo_data.id
}


output "aws_lambda_todo" {
  value = aws_lambda_function.todo.arn
}
