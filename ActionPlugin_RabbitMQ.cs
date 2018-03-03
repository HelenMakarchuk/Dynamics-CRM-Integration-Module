// <copyright file="ActionPlugin_RabbitMQ.cs" company="Korus Consulting">
// Copyright (c) 2017 All Rights Reserved
// </copyright>
// <author>Helena Makarchuk</author>
// <date>07.05.2017</date>
// <summary>Implements the ActionPlugin_RabbitMQ Plugin.</summary>

namespace DevTest.CRM_Integration_Plugins
{
    using System;
    using Microsoft.Xrm.Sdk;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Threading.Tasks;
    using RabbitMQ.Client;
    using RabbitMQ.Client.Events;
    using Newtonsoft.Json;

    /// <summary>
    /// Плагин реализует запись данных в очередь сообщений RabbitMQ
    /// </summary>    
    public class ActionPlugin_RabbitMQ: Plugin
    {
        string output_action_string = "";
        string input = "";
        ConnectionFactory factory;

        public ActionPlugin_RabbitMQ()
            : base(typeof(ActionPlugin_RabbitMQ))
        {
            base.RegisteredEvents.Add(new Tuple<int, string, string, Action<LocalPluginContext>>(40, "new_RabbitMQAction", "", new Action<LocalPluginContext>(ExecuteActionPlugin_RabbitMQ)));
        }

        protected void ExecuteActionPlugin_RabbitMQ(LocalPluginContext localContext)
        {
            if (localContext == null) throw new ArgumentNullException("localContext");
            var context = localContext.PluginExecutionContext;
            IOrganizationService service = localContext.OrganizationService;

            try
            {
                input = context.InputParameters.Contains("input") ? context.InputParameters["input"].ToString() : null;
                
                if (input != null && input != "")
                {
                    string[] parts = input.Split(';');

                    if (parts[0] == "RabbitMQ_Test_transfer_Uri")
                    {
                        try
                        {
                            //кнопка: Доступ по Uri -> Выполнить тестовую передачу данных (RabbitMQ)
                            output_action_string = "RabbitMQ_Test_transfer_Uri*";

                            string[] getParams = new string[3] { "", "", "" };

                            for (int i = 1; i < 4; i++)
                            {
                                string value = "";
                                string param = parts.Length > i ? parts[i] : null;
                                if (param != String.Empty)
                                {
                                    string[] paramParts = param.Split('=');
                                    if (paramParts.Length > 1) value = paramParts[1];
                                }

                                getParams[i - 1] = value;
                            }

                            //Connect
                            factory = GetFactoryConnection(getParams[0]);
                            
                            //send
                            //SendToRabbit(factory, getParams[1], getParams[2], "test");

                            context.OutputParameters["output"] = output_action_string + "success*" + getParams[0];
                        }
                        catch (Exception ex)
                        {
                            context.OutputParameters["output"] = output_action_string + "error";
                            throw new Exception(parts[0] + ": " + ex.Message);
                        }
                    }
                    else if (parts[0] == "RabbitMQ_Test_transfer_Params")
                    {
                        try
                        {
                            //кнопка: Доступ по параметрам -> Выполнить тестовую передачу данных (RabbitMQ)
                            output_action_string = "RabbitMQ_Test_transfer_Params*";
                            string[] getParams = new string[7] { "", "", "", "", "", "", "" }; //HostName, Port, VirtualHost, UserName, Password, Queue, RoutingKey

                            for (int i = 1; i < 8; i++)
                            {
                                string value = "";
                                string param = parts.Length > i ? parts[i] : null;
                                if (param != String.Empty)
                                {
                                    string[] paramParts = param.Split('=');
                                    if (paramParts.Length > 1) value = paramParts[1];
                                }

                                getParams[i - 1] = value;
                            }

                            //create uri as amqp://user:pass@host:10000/vhost

                            string uri = "amqp://";

                            int n;
                            if (getParams[3] != String.Empty && getParams[3] != null) uri += getParams[3] + ":"; //UserName
                            if (getParams[4] != String.Empty && getParams[4] != null) uri += getParams[4]; //Password
                            if (getParams[0] != String.Empty && getParams[0] != null) uri += "@" + getParams[0]; //HostName
                            if (getParams[1] != String.Empty && getParams[1] != null && int.TryParse(getParams[1], out n)) uri += ":" + getParams[1]; //Port
                            if (getParams[2] != String.Empty && getParams[2] != null) uri += "/" + getParams[2]; //VirtualHost

                            //Connect
                            factory = GetFactoryConnection(uri);

                            //send
                            //SendToRabbit(factory, getParams[5], getParams[6], "test");

                            context.OutputParameters["output"] = output_action_string + "success*" + uri;
                        }
                        catch (Exception ex)
                        {
                            context.OutputParameters["output"] = output_action_string + "error";
                            throw new Exception(parts[0] + ": " + ex.Message);
                        }
                    }
                    else if (parts[0] == "RabbitMqIntegrationCreate" || parts[0] == "RabbitMqIntegrationUpdate" || parts[0] == "RabbitMqIntegrationDelete")
                    {
                        try
                        {
                            //получены данные для проведения односторонней интеграции из crm системы в RabbitMQ.
                            output_action_string = "RabbitMqIntegrationCreate";
                            
                            string[] getParams = new string[3] { "", "", "" };

                            for (int i = 1; i < 4; i++)
                            {
                                string value = "";
                                string param = parts.Length > i ? parts[i] : null;
                                if (param != String.Empty)
                                {
                                    string[] paramParts = param.Split('=');
                                    if (paramParts.Length > 1) value = paramParts[1];
                                }

                                getParams[i - 1] = value;
                            }

                            string today = DateTime.Today.Day + "." + DateTime.Today.Month + "." + DateTime.Today.Year + "." + DateTime.Today.TimeOfDay;
                            string operation = "";

                            if (parts[0] == "RabbitMqIntegrationCreate") operation = "Create";
                            else if (parts[0] == "RabbitMqIntegrationUpdate") operation = "Update";
                            else if (parts[0] == "SqlDatabaseIntegrationDelete") operation = "Delete";

                            string resultPass = today + ";" + operation + ";";

                            for (int i = 5; i < parts.Length; i++)
                                resultPass += parts[i] + ";";

                            //Connect
                            factory = GetFactoryConnection(getParams[0]);

                            //send
                            //SendToRabbit(factory, getParams[1], getParams[2], resultPass);

                            context.OutputParameters["output"] = output_action_string + ":LogInfo:" + "success";
                        }
                        catch (Exception ex)
                        {
                            context.OutputParameters["output"] = output_action_string + ":LogInfo:" + "error";
                            throw new Exception(parts[0] + ": " + ex.Message);
                        }
                    }
                }
                
                //throw new Exception(ex.Message);
            }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException(String.Format("Ошибка в плагине ActionPlugin_RabbitMQ: {0}\n{1}", ex.Message, ex.StackTrace), ex);
            }
        }

        protected void SendToRabbit(ConnectionFactory factory, string queue, string routingKey, string msg)
        {
            try
            {
                string message = JsonConvert.SerializeObject(msg);
                var body = Encoding.UTF8.GetBytes(message);

                using (IConnection connection = factory.CreateConnection())
                using (IModel channel = connection.CreateModel())
                {
                    channel.QueueDeclare(queue: queue, durable: false, exclusive: false, autoDelete: false, arguments: null);
                    channel.BasicPublish(exchange: "", routingKey: routingKey, basicProperties: null, body: body);
                }
            }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException(String.Format("Не удалось отправить данные: {0}\n{1}", ex.Message, ex.StackTrace), ex);
            }
        }

        protected ConnectionFactory GetFactoryConnection(string uri)
        {
            try
            {
                ConnectionFactory factory = new ConnectionFactory();

                if (uri != String.Empty && uri != null)
                {
                    factory.Uri = uri;
                }

                return factory;
            }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException(String.Format("Не удалось подключиться к указанному серверу: {0}\n{1}", ex.Message, ex.StackTrace), ex);
            }
        }
    }
}