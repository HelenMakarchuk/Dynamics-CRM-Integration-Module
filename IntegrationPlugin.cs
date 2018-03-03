// <copyright file="IntegrationPlugin.cs" company="Korus Consulting">
// Copyright (c) 2017 All Rights Reserved
// </copyright>
// <author>Helena Makarchuk</author>
// <date>07.05.2017</date>
// <summary>Implements the IntegrationPlugin Plugin.</summary>

namespace DevTest.CRM_Integration_Plugins
{
    using System;
    using Microsoft.Xrm.Sdk;
    using Microsoft.Xrm.Sdk.Query;
    using System.Linq;
    using System.Collections.Generic;
    using Microsoft.Xrm.Sdk.Messages;
    using Microsoft.Xrm.Sdk.Metadata;
    using System.ServiceModel;

    /// <summary>
    /// Плагин выполняет проверки на необходимость осуществления односторонней интеграции
    /// </summary>    
    public class IntegrationPlugin : Plugin
    {
        private readonly string preImageAlias = "PreImage";
        private readonly string postImageAlias = "PostImage";
        private string messageName = "";
        private string entityLogicalName = "";
        IOrganizationService service;
        string[] databaseAttrs = new string[] { "new_entityfields", "new_datasourcefields", "new_connectionstring", "new_entity_record_id", "new_databasetablename" };
        string[] rabbitAttrs = new string[] { "new_entityfields", "new_rabbit_uri", "new_rabbit_queue", "new_rabbit_routingkey" };

        public IntegrationPlugin()
            : base(typeof(IntegrationPlugin))
        {
            base.RegisteredEvents.Add(new Tuple<int, string, string, Action<LocalPluginContext>>(40, "Create", "", new Action<LocalPluginContext>(ExecuteIntegrationPlugin)));
            base.RegisteredEvents.Add(new Tuple<int, string, string, Action<LocalPluginContext>>(40, "Update", "", new Action<LocalPluginContext>(ExecuteIntegrationPlugin)));
            base.RegisteredEvents.Add(new Tuple<int, string, string, Action<LocalPluginContext>>(40, "Delete", "", new Action<LocalPluginContext>(ExecuteIntegrationPlugin)));
        }

        protected void ExecuteIntegrationPlugin(LocalPluginContext localContext)
        {
            if (localContext == null) throw new ArgumentNullException("localContext");
            var context = localContext.PluginExecutionContext;
            service = localContext.OrganizationService;
            Entity targetEntity = (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity) ? (Entity)context.InputParameters["Target"] : null;
            Entity postImageEntity = (context.PostEntityImages != null && context.PostEntityImages.Contains(this.postImageAlias)) ? context.PostEntityImages[this.postImageAlias] : null;
            Entity preImageEntity = (context.PostEntityImages != null && context.PreEntityImages.Contains(this.preImageAlias)) ? context.PreEntityImages[this.preImageAlias] : null;
            EntityReference targetEntityRef = (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is EntityReference) ? (EntityReference)context.InputParameters["Target"] : null;
            messageName = context.MessageName;

            try
            {
                if (context.Stage == 40 && messageName == "Create" && targetEntity != null)
                {
                    entityLogicalName = targetEntity.LogicalName;
                    if (entityLogicalName == "new_integrationpoint" || entityLogicalName == "new_integrationpointlog") return;
                    DataCollection<Entity> integrationPoints = GetIntegrationPoints();

                    foreach (Entity point in integrationPoints)
                    {
                        string output = "";
                        string input = "";
                        int? datasource = point.Contains("new_datasource_optionset") ? ((OptionSetValue)point["new_datasource_optionset"]).Value : (int?)null;
                        if (datasource == 100000000) /*Microsoft SQL Server*/
                        {
                            input = ExecuteSqlDatabaseIntegration(point.Id, "SqlDatabaseIntegrationCreate", targetEntity);
                            output = CallAction(input, "new_DatabaseAction");
                        }
                        else if (datasource == 100000001) /*WCF Service*/
                        {
                            BasicHttpBinding binding = new BasicHttpBinding();
                            binding.Name = "BasicHttpBinding_IService1";
                            EndpointAddress address = new EndpointAddress("http://crm2016.korusconsulting.ru/ISV/DemoWcfServiceCrm2016/Service1.svc");
                            var factory = new ChannelFactory<ServiceReference1.IService1>(binding, address);
                            ServiceReference1.IService1 channel = factory.CreateChannel();
                            string serviceResult = channel.GetData();
                        }
                        else if (datasource == 100000002) /*RabbitMQ*/
                        {
                            input = ExecuteRabbitMqIntegration(point.Id, "RabbitMqIntegrationCreate", targetEntity);
                            output = CallAction(input, "new_RabbitMQAction");
                        }

                        CreateLog(output, point.Id);
                    }
                }
                else if (context.Stage == 40 && messageName == "Update" && targetEntity != null)
                {
                    entityLogicalName = targetEntity.LogicalName;
                    if (entityLogicalName == "new_integrationpoint") return;
                    DataCollection<Entity> integrationPoints = GetIntegrationPoints();

                    foreach (Entity point in integrationPoints)
                    {
                        string output = "";
                        string input = "";
                        int? datasource = point.Contains("new_datasource_optionset") ? ((OptionSetValue)point["new_datasource_optionset"]).Value : (int?)null;

                        if (datasource == 100000000) /*Microsoft SQL Server*/
                        {
                            input = ExecuteSqlDatabaseIntegration(point.Id, "SqlDatabaseIntegrationUpdate", targetEntity);
                            output = CallAction(input, "new_DatabaseAction");
                        }
                        else if (datasource == 100000001) /*WCF Service*/
                        {

                        }
                        else if (datasource == 100000002) /*RabbitMQ*/
                        {
                            input = ExecuteRabbitMqIntegration(point.Id, "RabbitMqIntegrationUpdate", targetEntity);
                            output = CallAction(input, "new_RabbitMQAction");
                        }

                        CreateLog(output, point.Id);
                    }
                }
                else if (context.Stage == 40 && messageName == "Delete" && targetEntityRef != null && preImageEntity != null)
                {
                    entityLogicalName = targetEntityRef.LogicalName;
                    if (entityLogicalName == "new_integrationpoint") return;
                    DataCollection<Entity> integrationPoints = GetIntegrationPoints();
                    
                    foreach (Entity point in integrationPoints)
                    {
                        string output = "";
                        string input = "";
                        int? datasource = point.Contains("new_datasource_optionset") ? ((OptionSetValue)point["new_datasource_optionset"]).Value : (int?)null;

                        if (datasource == 100000000) /*Microsoft SQL Server*/
                        {
                            input = ExecuteSqlDatabaseIntegration(point.Id, "SqlDatabaseIntegrationDelete", preImageEntity);
                            output = CallAction(input, "new_DatabaseAction");
                        }
                        else if (datasource == 100000001) /*WCF Service*/
                        {

                        }
                        else if (datasource == 100000002) /*RabbitMQ*/
                        {
                            input = ExecuteRabbitMqIntegration(point.Id, "RabbitMqIntegrationDelete", preImageEntity);
                            output = CallAction(input, "new_RabbitMQAction");
                        }

                        CreateLog(output, point.Id);
                    }
                }
            }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException(String.Format("Ошибка в плагине IntegrationPlugin: {0}\n{1}", ex.Message, ex.StackTrace), ex);
            }
        }

        protected void CreateLog(string output, Guid pointId)
        {
            try
            {
                if (output != "")
                {
                    string[] outputParts = output.Split(':');

                    if (outputParts.Length > 2)
                    {
                        Entity log = new Entity("new_integrationpointlog");
                        log["new_integrationpointid"] = new EntityReference("new_integrationpoint", pointId);
                        log["new_info"] = outputParts[2];
                        log["new_name"] = DateTime.Now.ToString();
                        Guid createdLogId = service.Create(log);
                    }
                }
            }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException("CreateLog: " + ex.Message, ex);
            }
        }

        protected DataCollection<Entity> GetIntegrationPoints()
        {
            try
            {
                QueryExpression qIntegrationPoints = new QueryExpression("new_integrationpoint");
                qIntegrationPoints.ColumnSet = new ColumnSet("new_datasource_optionset");
                FilterExpression filter = qIntegrationPoints.Criteria.AddFilter(LogicalOperator.And);
                filter.Conditions.Add(new ConditionExpression("new_entity_logical_name", ConditionOperator.Equal, entityLogicalName));
                filter.Conditions.Add(new ConditionExpression("new_operation", ConditionOperator.Equal, messageName));
                filter.Conditions.Add(new ConditionExpression("statecode", ConditionOperator.Equal, 0));
                qIntegrationPoints.Criteria.Filters.Add(filter);
                qIntegrationPoints.NoLock = true;
                DataCollection<Entity> integrationPoints = service.RetrieveMultiple(qIntegrationPoints).Entities;
                return integrationPoints;
            }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException("GetIntegrationPoints: " + ex.Message, ex);
            }
        }

        protected string ExecuteRabbitMqIntegration(Guid pointId, string inputStart, Entity targetEntity)
        {
            try
            {
                Entity integrationPoint = service.Retrieve("new_integrationpoint", pointId, new ColumnSet(rabbitAttrs));

                string entityfields = integrationPoint.Contains("new_entityfields") ? integrationPoint["new_entityfields"].ToString() : null;
                string rabbitUri = integrationPoint.Contains("new_rabbit_uri") ? integrationPoint["new_rabbit_uri"].ToString() : null;
                string rabbitQueue = integrationPoint.Contains("new_rabbit_queue") ? integrationPoint["new_rabbit_queue"].ToString() : null;
                string rabbitRoutingKey = integrationPoint.Contains("new_rabbit_routingkey") ? integrationPoint["new_rabbit_routingkey"].ToString() : null;

                //get entityAttrNames
                List<string> entityAttrNames = (entityfields.Split(new String[] { Environment.NewLine }, StringSplitOptions.RemoveEmptyEntries))[0].Split('.').ToList();
                entityAttrNames.RemoveAt(0);

                for (int i = 0; i < entityAttrNames.Count; i++)
                {
                    string noGapAttr = entityAttrNames[i].Replace(" ", "");
                    entityAttrNames[i] = noGapAttr.Substring(0, noGapAttr.IndexOf('('));
                }

                //add guid to entityAttrNames
                entityAttrNames.Add(entityLogicalName + "id");

                //create input string
                string input = inputStart + ";"
                    + "rabbitUri=" + rabbitUri + ";"
                    + "rabbitQueue=" + rabbitQueue + ";"
                    + "rabbitRoutingKey=" + rabbitRoutingKey + ";"
                    + "attributes;";

                for (int i = 0; i < entityAttrNames.Count; i++)
                {
                    if (targetEntity.Contains(entityAttrNames[i]))
                    {
                        if (targetEntity[entityAttrNames[i]] != null)
                        {
                            string attrType = (targetEntity[entityAttrNames[i]]).GetType().ToString();

                            if (attrType == "System.String")
                            {
                                input += entityAttrNames[i] + "&" + targetEntity[entityAttrNames[i]].ToString() + ";";
                            }
                            else if (attrType == "System.DateTime")
                            {
                                input += entityAttrNames[i] + "&" + ((DateTime)targetEntity[entityAttrNames[i]]).ToString("MM-dd-yyyy HH:mm:ss") + ";";
                            }
                            else if (attrType == "System.Int32")
                            {
                                input += entityAttrNames[i] + "&" + targetEntity[entityAttrNames[i]].ToString() + ";";
                            }
                            else if (attrType == "System.Boolean")
                            {
                                input += entityAttrNames[i] + "&" + targetEntity[entityAttrNames[i]].ToString() + ";";
                            }
                            else if (attrType == "Microsoft.Xrm.Sdk.OptionSetValue")
                            {
                                int optionSetValue = ((OptionSetValue)targetEntity[entityAttrNames[i]]).Value;

                                var attReq = new RetrieveAttributeRequest();
                                attReq.EntityLogicalName = targetEntity.LogicalName;
                                attReq.LogicalName = entityAttrNames[i];
                                attReq.RetrieveAsIfPublished = true;

                                var attResponse = (RetrieveAttributeResponse)service.Execute(attReq);
                                var attMetadata = (EnumAttributeMetadata)attResponse.AttributeMetadata;

                                string optionText = attMetadata.OptionSet.Options.Where(x => x.Value == optionSetValue).FirstOrDefault().Label.UserLocalizedLabel.Label;
                                input += entityAttrNames[i] + "&" + optionText + ";";
                            }
                            else if (attrType == "Microsoft.Xrm.Sdk.EntityReference")
                            {
                                input += entityAttrNames[i] + "&" + ((EntityReference)targetEntity[entityAttrNames[i]]).Id.ToString() + ";";
                            }
                            else if (attrType == "System.Guid")
                            {
                                input += entityAttrNames[i] + "&" + targetEntity[entityAttrNames[i]].ToString() + ";";
                            }
                        }
                        else
                        {
                            input += entityAttrNames[i] + "&;";
                        }
                    }
                }

                input = input.Substring(0, input.Length - 1);
                return input;
            }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException("ExecuteRabbitMqIntegration: " + ex.Message, ex);
            }
        }

        protected string ExecuteSqlDatabaseIntegration(Guid pointId, string inputStart, Entity targetEntity)
        {
            try
            {
                Entity integrationPoint = service.Retrieve("new_integrationpoint", pointId, new ColumnSet(databaseAttrs));

                string entityfields = integrationPoint.Contains("new_entityfields") ? integrationPoint["new_entityfields"].ToString() : null;
                string datasourcefields = integrationPoint.Contains("new_datasourcefields") ? integrationPoint["new_datasourcefields"].ToString() : null;
                string connectionstring = integrationPoint.Contains("new_connectionstring") ? integrationPoint["new_connectionstring"].ToString() : null;
                string entity_record_id = integrationPoint.Contains("new_entity_record_id") ? integrationPoint["new_entity_record_id"].ToString() : null;
                string databasetablename = integrationPoint.Contains("new_databasetablename") ? integrationPoint["new_databasetablename"].ToString() : null;

                //get entityAttrNames
                List<string> entityAttrNames = (entityfields.Split(new String[] { Environment.NewLine }, StringSplitOptions.RemoveEmptyEntries))[0].Split('.').ToList();
                entityAttrNames.RemoveAt(0);

                for (int i = 0; i < entityAttrNames.Count; i++)
                {
                    string noGapAttr = entityAttrNames[i].Replace(" ", "");
                    entityAttrNames[i] = noGapAttr.Substring(0, noGapAttr.IndexOf('('));
                }

                //add guid to entityAttrNames
                entityAttrNames.Add(entityLogicalName + "id");

                //get datasourceAttrNames
                List<string> datasourceAttrNames = (datasourcefields.Split(new String[] { Environment.NewLine }, StringSplitOptions.RemoveEmptyEntries))[0].Split('.').ToList();
                datasourceAttrNames.RemoveAt(0);

                for (int i = 0; i < datasourceAttrNames.Count; i++)
                {
                    string s = datasourceAttrNames[i].TrimStart();
                    s = s.Replace("\n", " ");

                    if (s.Contains(' '))
                    {
                        string[] helpArray = s.Split(' ');
                        datasourceAttrNames[i] = helpArray[0];
                    }
                    else
                    {
                        datasourceAttrNames[i] = s;
                    }
                }

                //add guid to datasourceAttrNames
                datasourceAttrNames.Add(entity_record_id);

                //create input string
                string input = inputStart + ":"
                    + "connectionstring:" + connectionstring
                    + ":databasetablename:" + databasetablename + ":attributes:";

                for (int i = 0; i < entityAttrNames.Count; i++)
                {
                    if (targetEntity.Contains(entityAttrNames[i]))
                    {
                        if (targetEntity[entityAttrNames[i]] != null)
                        {
                            string attrType = targetEntity[entityAttrNames[i]].GetType().ToString();

                            if (attrType == "System.String")
                            {
                                input += datasourceAttrNames[i] + "&" + targetEntity[entityAttrNames[i]].ToString() + ";";
                            }
                            else if (attrType == "System.DateTime")
                            {
                                input += datasourceAttrNames[i] + "&" + ((DateTime)targetEntity[entityAttrNames[i]]).ToString("MM-dd-yyyy HH:mm:ss") + ";";
                            }
                            else if (attrType == "System.Int32")
                            {
                                input += datasourceAttrNames[i] + "&" + targetEntity[entityAttrNames[i]].ToString() + ";";
                            }
                            else if (attrType == "System.Boolean")
                            {
                                input += datasourceAttrNames[i] + "&" + targetEntity[entityAttrNames[i]].ToString() + ";";
                            }
                            else if (attrType == "Microsoft.Xrm.Sdk.OptionSetValue")
                            {
                                int optionSetValue = ((OptionSetValue)targetEntity[entityAttrNames[i]]).Value;

                                var attReq = new RetrieveAttributeRequest();
                                attReq.EntityLogicalName = targetEntity.LogicalName;
                                attReq.LogicalName = entityAttrNames[i];
                                attReq.RetrieveAsIfPublished = true;

                                var attResponse = (RetrieveAttributeResponse)service.Execute(attReq);
                                var attMetadata = (EnumAttributeMetadata)attResponse.AttributeMetadata;

                                string optionText = attMetadata.OptionSet.Options.Where(x => x.Value == optionSetValue).FirstOrDefault().Label.UserLocalizedLabel.Label;
                                input += datasourceAttrNames[i] + "&" + optionText + ";";
                            }
                            else if (attrType == "Microsoft.Xrm.Sdk.EntityReference")
                            {
                                input += datasourceAttrNames[i] + "&" + ((EntityReference)targetEntity[entityAttrNames[i]]).Id.ToString() + ";";
                            }
                            else if (attrType == "System.Guid")
                            {
                                input += datasourceAttrNames[i] + "&" + targetEntity[entityAttrNames[i]].ToString() + ";";
                            }
                        }
                        else
                        {
                            input += datasourceAttrNames[i] + "&;";
                        }
                    }
                }

                input = input.Substring(0, input.Length - 1);
                return input;
            }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException("ExecuteSqlDatabaseIntegration: " + ex.Message, ex);
            }
        }

        protected string CallAction(string input, string actionName)
        {
            try
            {
                OrganizationRequest req = new OrganizationRequest(actionName);
                req["input"] = input;
                OrganizationResponse response = service.Execute(req);
                return response.Results["output"].ToString();
            }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException("GetIntegrationPoints: " + ex.Message, ex);
            }
        }
    }
}
