// <copyright file="IntegrationPointPlugin.cs" company="Korus Consulting">
// Copyright (c) 2017 All Rights Reserved
// </copyright>
// <author>Helena Makarchuk</author>
// <date>07.05.2017</date>
// <summary>Implements the IntegrationPointPlugin Plugin.</summary>

namespace DevTest.CRM_Integration_Plugins
{
    using System;
    using Microsoft.Xrm.Sdk;

    /// <summary>
    /// Плагин реализует запрет на ручное создание и изменение записи сущности «Точка интеграции»
    /// </summary>    
    public class IntegrationPointPlugin : Plugin
    {
        private readonly string preImageAlias = "PreImage";

        public IntegrationPointPlugin()
            : base(typeof(IntegrationPointPlugin))
        {
            base.RegisteredEvents.Add(new Tuple<int, string, string, Action<LocalPluginContext>>(20, "Create", "new_integrationpoint", new Action<LocalPluginContext>(ExecuteIntegrationPointPlugin)));
            base.RegisteredEvents.Add(new Tuple<int, string, string, Action<LocalPluginContext>>(20, "Update", "new_integrationpoint", new Action<LocalPluginContext>(ExecuteIntegrationPointPlugin)));
        }

        protected void ExecuteIntegrationPointPlugin(LocalPluginContext localContext)
        {
            if (localContext == null) throw new ArgumentNullException("localContext");
            var context = localContext.PluginExecutionContext;
            var service = localContext.OrganizationService;
            Entity targetEntity = (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity) ? (Entity)context.InputParameters["Target"] : null;
            Entity preImageEntity = (context.PostEntityImages != null && context.PreEntityImages.Contains(this.preImageAlias)) ? context.PreEntityImages[this.preImageAlias] : null;

            try
            {
                if (context.Stage == 20 && (context.MessageName == "Create" || context.MessageName == "Update") && targetEntity != null)
                {
                    if (context.MessageName == "Create")
                    {
                        if ((targetEntity.Contains("new_changing_enabled") && (bool)targetEntity["new_changing_enabled"] != true)
                        || !targetEntity.Contains("new_changing_enabled"))
                        {
                            throw new Exception("Изменять/создавать запись можно только в модуле \"CRM_Integration_Solution\"");
                        }
                    }
                    else if (context.MessageName == "Update")
                    {
                        if ((targetEntity.Contains("new_changing_enabled") && (bool)targetEntity["new_changing_enabled"] != true)
                        || (!targetEntity.Contains("new_changing_enabled") && preImageEntity != null
                        && ((preImageEntity.Contains("new_changing_enabled") && (bool)preImageEntity["new_changing_enabled"] != true)
                        || !preImageEntity.Contains("new_changing_enabled"))))
                        {
                            throw new Exception("Изменять/создавать запись можно только в модуле \"CRM_Integration_Solution\"");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException(ex.Message);
            }
        }
    }
}
