// <copyright file="ActionPlugin_Database.cs" company="Korus Consulting">
// Copyright (c) 2017 All Rights Reserved
// </copyright>
// <author>Helena Makarchuk</author>
// <date>07.05.2017</date>
// <summary>Implements the ActionPlugin_Database Plugin.</summary>

namespace DevTest.CRM_Integration_Plugins
{
    using System;
    using Microsoft.Xrm.Sdk;
    using System.Data.SqlClient;
    using System.Collections.Generic;
    using System.Data;

    /// <summary>
    /// Плагин реализует запись данных в таблицу базы данных
    /// </summary>    
    public class ActionPlugin_Database : Plugin
    {
        SqlConnection con;
        string output_action_string = "";
        string input = "";

        public ActionPlugin_Database()
            : base(typeof(ActionPlugin_Database))
        {
            base.RegisteredEvents.Add(new Tuple<int, string, string, Action<LocalPluginContext>>(40, "new_DatabaseAction", "", new Action<LocalPluginContext>(ExecuteActionPlugin_Database)));
        }

        protected void ExecuteActionPlugin_Database(LocalPluginContext localContext)
        {
            if (localContext == null) throw new ArgumentNullException("localContext");
            var context = localContext.PluginExecutionContext;
            IOrganizationService service = localContext.OrganizationService;

            try
            {
                input = context.InputParameters.Contains("input") ? context.InputParameters["input"].ToString() : null;

                if (input != null && input != "")
                {
                    string[] parts = input.Split(':');

                    if (parts[0] == "db_server_win")
                    {
                        //кнопка: Генерация строки подключения к бд: Интегрированная аутентификация: подключение к серверу
                        #region
                        output_action_string = "db_server_win:";
                        string[] con_str_parts = parts[1].Split(';');
                        List<string> list = GetDatabaseList(con_str_parts[0]);

                        foreach (string element in list)
                            output_action_string += element + ";";

                        context.OutputParameters["output"] = output_action_string;
                        #endregion
                    }
                    else if (parts[0] == "db_server_sql")
                    {
                        //кнопка: Генерация строки подключения к бд: Аутентификация SQL Server: подключение к серверу
                        #region
                        output_action_string = "db_server_sql:";
                        string[] con_str_parts = parts[1].Split(';');
                        List<string> list = GetDatabaseList(con_str_parts[0], con_str_parts[1], con_str_parts[2]);

                        foreach (string element in list)
                            output_action_string += element + ";";

                        context.OutputParameters["output"] = output_action_string;
                        #endregion
                    }
                    else if (parts[0] == "db")
                    {
                        //кнопка: подключение к БД через строку подключения: выполнить подключение
                        #region
                        output_action_string = "db:";
                        string con_str = parts[1];
                        List<string> list = GetTableList(con_str);

                        foreach (string element in list)
                            output_action_string += element + ";";

                        context.OutputParameters["output"] = output_action_string;
                        #endregion
                    }
                    else if (parts[0] == "db_name_win")
                    {
                        //кнопка: Генерация строки подключения к бд: Интегрированная аутентификация: подключение к базе данных
                        #region
                        output_action_string = "db_name:";
                        string[] con_str_parts = parts[1].Split(';');
                        List<string> list = GetTableList(con_str_parts[0], con_str_parts[1]);

                        foreach (string element in list)
                            output_action_string += element + ";";

                        context.OutputParameters["output"] = output_action_string;
                        #endregion
                    }
                    else if (parts[0] == "db_name_sql")
                    {
                        //кнопка: Генерация строки подключения к бд: Аутентификация SQL Server: подключение к базе данных
                        #region
                        output_action_string = "db_name:";
                        string[] con_str_parts = parts[1].Split(';');
                        List<string> list = GetTableList(con_str_parts[0], con_str_parts[1], con_str_parts[2], con_str_parts[3]);

                        foreach (string element in list)
                            output_action_string += element + ";";

                        context.OutputParameters["output"] = output_action_string;
                        #endregion
                    }
                    else if (parts[0] == "db_table_name_con_string")
                    {
                        //кнопка: подключение к БД через строку подключения: подключение к таблице базы данных
                        #region
                        output_action_string = "db_table_name:";
                        string[] con_str_parts = parts[1].Split('&');
                        List<string> list = GetTableColomnList(con_str_parts[0], con_str_parts[1]);

                        foreach (string element in list)
                            output_action_string += element + ";";

                        context.OutputParameters["output"] = output_action_string;
                        #endregion
                    }
                    else if (parts[0] == "db_table_name_win")
                    {
                        //кнопка: Генерация строки подключения к бд: Интегрированная аутентификация: подключение к таблице базы данных
                        #region
                        output_action_string = "db_table_name:";
                        string[] con_str_parts = parts[1].Split(';');
                        List<string> list = GetTableColomnList(con_str_parts[0], con_str_parts[1], con_str_parts[2]);

                        foreach (string element in list)
                            output_action_string += element + ";";

                        context.OutputParameters["output"] = output_action_string;
                        #endregion
                    }
                    else if (parts[0] == "db_table_name_sql")
                    {
                        //кнопка: Генерация строки подключения к бд: Аутентификация SQL Server: подключение к таблице базы данных
                        #region
                        output_action_string = "db_table_name:";
                        string[] con_str_parts = parts[1].Split(';');
                        List<string> list = GetTableColomnList(con_str_parts[0], con_str_parts[1], con_str_parts[2], con_str_parts[3], con_str_parts[4]);

                        foreach (string element in list)
                            output_action_string += element + ";";

                        context.OutputParameters["output"] = output_action_string;
                        #endregion
                    }
                    else if (parts[0] == "SqlDatabaseIntegrationCreate")
                    {
                        try
                        {
                            //получены данные для проведения односторонней интеграции из crm системы в бд MS SQL Server. Операция создания записей.
                            string connectionString = parts[2];
                            string databasetablename = parts[4];
                            string attrString = input.Substring(input.IndexOf("attributes") + 11);
                            string[] attrArray = attrString.Split(';');
                            List<string> attrNameList = new List<string>();
                            List<string> attrValueList = new List<string>();

                            foreach (string attr in attrArray)
                            {
                                string[] attrInfo = attr.Split('&');
                                if (attrInfo.Length == 2)
                                {
                                    attrNameList.Add(attrInfo[0]);
                                    attrValueList.Add(attrInfo[1]);
                                }
                            }

                            if (attrNameList.Count > 0)
                            {
                                SqlConnection con = new SqlConnection(connectionString);
                                SqlCommand cmd = new SqlCommand();
                                cmd.Connection = con;

                                string ds_fields_cmd = ""; //Name,PhoneNo,Address
                                string e_fields_cmd = ""; //@parameter1,@parameter2,@parameter3
                                int param_count = 0;

                                for (int i = 0; i < attrNameList.Count; i++)
                                {
                                    if (attrNameList[i] != null && attrNameList[i].ToString() != ""
                                        && attrValueList[i] != null && attrValueList[i].ToString() != "")
                                    {
                                        ds_fields_cmd += attrNameList[i] + ",";
                                        e_fields_cmd += "@param" + param_count + ",";
                                        cmd.Parameters.AddWithValue("@param" + param_count, attrValueList[i]);
                                        param_count++;
                                    }
                                }

                                if (ds_fields_cmd != "" && e_fields_cmd != "")
                                {
                                    ds_fields_cmd = ds_fields_cmd.Substring(0, ds_fields_cmd.Length - 1);
                                    e_fields_cmd = e_fields_cmd.Substring(0, e_fields_cmd.Length - 1);
                                    cmd.CommandText = "insert into " + databasetablename + " (" + ds_fields_cmd + ") values(" + e_fields_cmd + ")";
                                    if (con.State != ConnectionState.Open) con.Open();
                                    cmd.ExecuteNonQuery();
                                    if (con.State != ConnectionState.Closed) con.Close();
                                }
                            }

                            context.OutputParameters["output"] = "SqlDatabaseIntegrationStart:LogInfo:success";
                        }
                        catch (Exception ex)
                        {
                            context.OutputParameters["output"] = "SqlDatabaseIntegrationStart:LogInfo:error";
                            throw new Exception(ex.Message);
                        }
                    }
                    else if (parts[0] == "SqlDatabaseIntegrationUpdate")
                    {
                        try
                        {
                            //получены данные для проведения односторонней интеграции из crm системы в бд MS SQL Server. Операция обновления записей.
                            string connectionString = parts[2];
                            string databasetablename = parts[4];
                            string attrString = input.Substring(input.IndexOf("attributes") + 11);
                            string[] attrArray = attrString.Split(';');
                            List<string> attrNameList = new List<string>();
                            List<string> attrValueList = new List<string>();

                            foreach (string attr in attrArray)
                            {
                                string[] attrInfo = attr.Split('&');
                                if (attrInfo.Length == 2)
                                {
                                    attrNameList.Add(attrInfo[0]);
                                    attrValueList.Add(attrInfo[1]);
                                }
                            }
                            
                            if (attrNameList.Count > 0)
                            {
                                SqlConnection con = new SqlConnection(connectionString);
                                SqlCommand cmd = new SqlCommand();
                                cmd.Connection = con;
                                string commandText = "update " + databasetablename + " set ";

                                for (int i = 0; i < attrNameList.Count - 1; i++)
                                {
                                    if (attrNameList[i] != null && attrNameList[i].ToString() != ""
                                        && attrValueList[i] != null && attrValueList[i].ToString() != "")
                                    {
                                        commandText += attrNameList[i] + " = '" + attrValueList[i] + "',";
                                    }
                                }

                                if (commandText != "update " + databasetablename + " set ")
                                {
                                    commandText = commandText.Substring(0, commandText.Length - 1);
                                    commandText += " where id='" + attrValueList[attrValueList.Count - 1] + "'";
                                    cmd.CommandText = commandText;
                                    if (con.State != ConnectionState.Open) con.Open();
                                    cmd.ExecuteNonQuery();
                                    if (con.State != ConnectionState.Closed) con.Close();
                                }
                            }

                            context.OutputParameters["output"] = "SqlDatabaseIntegrationUpdate:LogInfo:success";
                        }
                        catch (Exception ex)
                        {
                            context.OutputParameters["output"] = "SqlDatabaseIntegrationUpdate:LogInfo:error";
                            throw new Exception(ex.Message);
                        }
                    }
                    else if (parts[0] == "SqlDatabaseIntegrationDelete")
                    {
                        try
                        {
                            //получены данные для проведения односторонней интеграции из crm системы в бд MS SQL Server. Операция удаления записей.
                            string connectionString = parts[2];
                            string databasetablename = parts[4];
                            string attrString = input.Substring(input.IndexOf("attributes") + 11);
                            string[] attrArray = attrString.Split(';');
                            List<string> attrNameList = new List<string>();
                            List<string> attrValueList = new List<string>();

                            foreach (string attr in attrArray)
                            {
                                string[] attrInfo = attr.Split('&');
                                if (attrInfo.Length == 2)
                                {
                                    attrNameList.Add(attrInfo[0]);
                                    attrValueList.Add(attrInfo[1]);
                                }
                            }

                            if (attrNameList.Count > 0)
                            {
                                SqlConnection con = new SqlConnection(connectionString);
                                SqlCommand cmd = new SqlCommand();
                                cmd.Connection = con;

                                string commandText = "Delete from " + databasetablename + 
                                    " where " + attrNameList[attrNameList.Count - 1] + "='" + attrValueList[attrValueList.Count - 1] + "'";

                                for (int i = 0; i < attrNameList.Count - 1; i++)
                                {
                                    if (attrNameList[i] != null && attrNameList[i].ToString() != ""
                                        && attrValueList[i] != null && attrValueList[i].ToString() != "")
                                    {
                                        commandText += " and " + attrNameList[i] + "='" + attrValueList[i] + "'";
                                    }
                                }

                                if (commandText != "Delete from " + databasetablename +
                                    " where " + attrNameList[attrNameList.Count - 1] + "='" + attrValueList[attrValueList.Count - 1] + "'")
                                {
                                    cmd.CommandText = commandText;
                                    if (con.State != ConnectionState.Open) con.Open();
                                    cmd.ExecuteNonQuery();
                                    if (con.State != ConnectionState.Closed) con.Close();
                                }
                            }

                            context.OutputParameters["output"] = "SqlDatabaseIntegrationDelete:LogInfo:success";
                        }
                        catch (Exception ex)
                        {
                            context.OutputParameters["output"] = "SqlDatabaseIntegrationDelete:LogInfo:error";
                            throw new Exception(ex.Message);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException(String.Format("Ошибка в плагине ActionPlugin_Database: {0}\n{1}", ex.Message, ex.StackTrace), ex);
            }
        }

        protected List<string> GetDatabaseList(string servername)
        {
            try
            {
                List<string> list = new List<string>();
                string conString = "Data Source=" + servername + ";Initial Catalog=master;Integrated Security=SSPI;";
                output_action_string += conString + "&";

                using (con = new SqlConnection(conString))
                {
                    if (con.State != ConnectionState.Open) con.Open();

                    using (SqlCommand cmd = new SqlCommand("SELECT name from sys.databases", con))
                    {
                        using (IDataReader dr = cmd.ExecuteReader())
                        {
                            while (dr.Read())

                                list.Add(dr[0].ToString());
                        }
                    }

                    if (con.State != ConnectionState.Closed) con.Close();
                }

                return list;
            }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException(String.Format("Не удалось подключиться к указанному серверу: {0}\n{1}", ex.Message, ex.StackTrace), ex);
            }
        }

        protected List<string> GetDatabaseList(string servername, string login, string password)
        {
            try
            {
                List<string> list = new List<string>();
                string conString = "Data Source=" + servername + ";Initial Catalog=master;User Id=" + login + ";Password=" + password + ";Integrated Security=false";
                output_action_string += conString + "&";

                using (con = new SqlConnection(conString))
                {
                    if (con.State != ConnectionState.Open) con.Open();

                    using (SqlCommand cmd = new SqlCommand("SELECT name from sys.databases", con))
                    {
                        using (IDataReader dr = cmd.ExecuteReader())
                        {
                            while (dr.Read())
                                list.Add(dr[0].ToString());
                        }
                    }

                    if (con.State != ConnectionState.Closed) con.Close();
                }

                return list;
            }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException(String.Format("Не удалось подключиться к указанному серверу: {0}\n{1}", ex.Message, ex.StackTrace), ex);
            }
        }

        protected List<string> GetTableList(string conString)
        {
            try
            {
                List<string> list = new List<string>();
                output_action_string += conString + "&";

                using (con = new SqlConnection(conString))
                {
                    if (con.State != ConnectionState.Open) con.Open();
                    using (SqlCommand cmd = new SqlCommand("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES", con))
                    {
                        using (IDataReader dr = cmd.ExecuteReader())
                        {
                            while (dr.Read())
                                list.Add(dr["TABLE_NAME"].ToString());
                        }
                    }

                    if (con.State != ConnectionState.Closed) con.Close();
                }

                return list;
            }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException(String.Format("Не удалось подключиться к базе данных: {0}\n{1}", ex.Message, ex.StackTrace), ex);
            }
        }

        protected List<string> GetTableList(string servername, string db_name)
        {
            try
            {
                List<string> list = new List<string>();
                string conString = "Data Source=" + servername + ";Initial Catalog=" + db_name + ";Integrated Security=SSPI;";
                output_action_string += conString + "&";

                using (con = new SqlConnection(conString))
                {
                    if (con.State != ConnectionState.Open) con.Open();

                    using (SqlCommand cmd = new SqlCommand("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES", con))
                    {
                        using (IDataReader dr = cmd.ExecuteReader())
                        {
                            while (dr.Read())
                                list.Add(dr["TABLE_NAME"].ToString());
                        }
                    }

                    if (con.State != ConnectionState.Closed) con.Close();
                }

                return list;
            }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException(String.Format("Не удалось подключиться к базе данных: {0}\n{1}", ex.Message, ex.StackTrace), ex);
            }
        }

        protected List<string> GetTableList(string servername, string login, string password, string db_name)
        {
            try
            {
                List<string> list = new List<string>();
                string conString = "Data Source=" + servername + ";Initial Catalog=" + db_name + ";User Id=" + login + ";Password=" + password + ";Integrated Security=false";
                output_action_string += conString + "&";

                using (con = new SqlConnection(conString))
                {
                    if (con.State != ConnectionState.Open) con.Open();

                    using (SqlCommand cmd = new SqlCommand("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES", con))
                    {
                        using (IDataReader dr = cmd.ExecuteReader())
                        {
                            while (dr.Read())
                                list.Add(dr["TABLE_NAME"].ToString());
                        }
                    }

                    if (con.State != ConnectionState.Closed) con.Close();
                }

                return list;
            }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException(String.Format("Не удалось подключиться к базе данных: {0}\n{1}", ex.Message, ex.StackTrace), ex);
            }
        }

        protected List<string> GetTableColomnList(string conString, string table)
        {
            try
            {
                List<string> list = new List<string>();
                output_action_string += conString + "&";

                using (con = new SqlConnection(conString))
                {
                    if (con.State != ConnectionState.Open) con.Open();
                    using (SqlCommand com = new SqlCommand(@"SELECT * FROM " + table, con))
                    {
                        using (SqlDataReader reader = com.ExecuteReader(CommandBehavior.SchemaOnly))
                        {
                            DataTable schemaTable = reader.GetSchemaTable();
                            foreach (DataRow colRow in schemaTable.Rows)
                                list.Add(colRow.Field<String>("ColumnName").ToString());
                        }
                    }

                    if (con.State != ConnectionState.Closed) con.Close();
                }

                return list;
            }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException(String.Format("Не удалось подключиться к базе данных: {0}\n{1}", ex.Message, ex.StackTrace), ex);
            }
        }

        protected List<string> GetTableColomnList(string servername, string db_name, string table)
        {
            try
            {
                List<string> list = new List<string>();
                string conString = "Data Source=" + servername + ";Initial Catalog=" + db_name + ";Integrated Security=SSPI;";
                output_action_string += conString + "&";

                using (con = new SqlConnection(conString))
                {
                    if (con.State != ConnectionState.Open) con.Open();

                    using (SqlCommand com = new SqlCommand(@"SELECT * FROM " + table, con))
                    {
                        using (SqlDataReader reader = com.ExecuteReader(CommandBehavior.SchemaOnly))
                        {
                            DataTable schemaTable = reader.GetSchemaTable();
                            foreach (DataRow colRow in schemaTable.Rows)
                                list.Add(colRow.Field<String>("ColumnName").ToString());
                        }


                    }

                    if (con.State != ConnectionState.Closed) con.Close();
                }

                return list;
            }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException(String.Format("Не удалось подключиться к базе данных: {0}\n{1}", ex.Message, ex.StackTrace), ex);
            }
        }

        protected List<string> GetTableColomnList(string servername, string db_name, string login, string password, string table)
        {
            try
            {
                List<string> list = new List<string>();
                string conString = "Data Source=" + servername + ";Initial Catalog=" + db_name + ";User Id=" + login + ";Password=" + password + ";Integrated Security=false";
                output_action_string += conString + "&";

                using (con = new SqlConnection(conString))
                {
                    if (con.State != ConnectionState.Open) con.Open();

                    using (SqlCommand com = new SqlCommand(@"SELECT * FROM " + table, con))
                    {
                        using (SqlDataReader reader = com.ExecuteReader(CommandBehavior.SchemaOnly))
                        {
                            DataTable schemaTable = reader.GetSchemaTable();
                            foreach (DataRow colRow in schemaTable.Rows)
                                list.Add(colRow.Field<String>("ColumnName").ToString());
                        }
                    }

                    if (con.State != ConnectionState.Closed) con.Close();
                }

                return list;
            }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException(String.Format("Не удалось подключиться к базе данных: {0}\n{1}", ex.Message, ex.StackTrace), ex);
            }
        }
    }
}
