/// <summary>Вспомогательная библиотека для работы с CRM</summary>
/// Версия: 1.0.0.0
/// Solution.WebAPI методы для работы с CRM WebAPI.
/// Solution.HTML методы для работы с решением.

if (typeof (Solution) == 'undefined') {
    window.Solution = new Object();
}

var var_names = ["table_row_count",
    "btnDBConnectionGenStr_click_count",
    "btnDBConnectionSqlAuth_click_count",
    "btnDBConnectionWinAuth_click_count",
    "btnDBConnectionStr_click_count",
    "source_list_choose_db_count",
    "source_list_choose_service_count",
    "source_list_choose_rabbit_count",
    "btnRabbitConnectionUri_click_count", 
    "btnRabbitConnectionParams_click_count",
    "servername",
    "login",
    "password",
    "db_name",
    "con_str",
    "auth",
    "result_constring",
    "rabbitUri",
    "rabbitQueue",
    "rabbitRoutingKey"];

var var_values = [0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    ""];

for (var i = 0; i < var_names.length; i++) window[var_names[i]] = var_values[i];

var entityfields = {};
var entityfieldsone = {};
var datasourcefields = {};

var entityfieldsoneIds = ["entity_attributes_list_one"];
entityfieldsone["entity_attributes_list_one"] = "";

var entityfieldsIds = ["entity_attributes_list"];
var datasourcefieldsIds = ["datasource_colomn_list"];
entityfields["entity_attributes_list"] = "";
datasourcefields["datasource_colomn_list"] = "";

$(document).ready(function () {
    $("#source_list").val("");
    var entities = Solution.WebAPI.getDataByQuery("EntityDefinitions?$select=DisplayName,LogicalName");
    if (entities && entities.value && entities.value.length > 0) {
        var logNameArray = [],
            logNameDict = [],
            dispNameDict = [],
            metIdDict = [];

        for (var i = 0; i < entities.value.length; i++) {
            var display_name = entities.value[i].DisplayName.UserLocalizedLabel;
            var logicalName = entities.value[i].LogicalName;

            if (logicalName.substring(0, logicalName.indexOf('_')) != "msdyn" && display_name != null) {
                logNameArray.push(entities.value[i].LogicalName);
                logNameDict[entities.value[i].LogicalName] = i;
                dispNameDict[i] = display_name.Label;
                metIdDict[i] = entities.value[i].MetadataId;
            }
        }

        if (logNameArray.length > 0) {
            logNameArray.sort();
            for (var i = 0; i < logNameArray.length; i++) {
                var new_entity_option = document.createElement('option');
                new_entity_option.innerHTML = logNameArray[i] + "   (" + dispNameDict[logNameDict[logNameArray[i]]] + ")";
                new_entity_option.setAttribute("id", metIdDict[logNameDict[logNameArray[i]]]);
                entity_list.appendChild(new_entity_option);
            }
        }
    }

    var integ_points = Solution.WebAPI.getEntitiesByQuery("new_integrationpoints", "?$select=new_displayname");
    if (integ_points && integ_points.value && integ_points.value.length > 0) {
        for (var i = 0; i < integ_points.value.length; i++) {
            var new_integ_points_option = document.createElement('option');
            new_integ_points_option.innerHTML = integ_points.value[i].new_displayname;
            new_integ_points_option.setAttribute("id", integ_points.value[i].new_integrationpointid);
            configuration_point_list.appendChild(new_integ_points_option);
        }
    }
});

Solution.WebAPI = function () {
    var path = location.pathname.split("/");
    var _serverUrl = location.protocol + "//" + location.host + "/" + (path[0] ? path[0] : path[1]);
    var _ODataPath = _serverUrl + "/api/data/v8.0";
    var entityUri;

    var _sendRequestToWebAPIEndpoint = function (type, fullQuery, data, setEntityUri) {
        var request = new XMLHttpRequest();
        request.open(type, _ODataPath + "/" + fullQuery, false);
        request.setRequestHeader("Accept", "application/json");
        request.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        request.setRequestHeader('Cache-Control', 'no-cache');
        request.setRequestHeader('Pragma', 'no-cache');
        request.setRequestHeader('Prefer', 'odata.include-annotations=*');
        request.setRequestHeader("OData-MaxVersion", "4.0");
        request.setRequestHeader("OData-Version", "4.0");

        if (setEntityUri) {
            request.onreadystatechange = function () {
                if (this.readyState == 4) {
                    request.onreadystatechange = null;

                    if (this.status == 204) {
                        entityUri = this.getResponseHeader("OData-EntityId");
                    }
                }
            };
        }

        if (data)
            request.send(data);
        else
            request.send();

        var response = request.responseText
            ? (JSON
               ? JSON.parse(request.responseText)
               : Sys.Serialization.JavaScriptSerializer.deserializsetne(request.responseText))
            : null;
        if (response && response.error && response.error.message) {
            var rnd = new Date().getMilliseconds().toString();
            window.parent.Xrm.Page.ui.setFormNotification(response.error.message, 'ERROR', rnd);
            setTimeout(function () { window.parent.Xrm.Page.ui.clearFormNotification(rnd); }, 5000)
        }

        return response;
    }

    var _getDataByQuery = function (query) {
        /// <summary>Возвращает массив данных, удовлетворяющие параметрам запроса</summary>
        /// <param name="query">Параметры запроса. Регистрозависимый параметр</param>
        /// <returns type="Array">Массив данных</returns>
        var response = _sendRequestToWebAPIEndpoint("GET", query);

        return (response && response.error) ? null : response;
    }

    var _getEntitiesByQuery = function (entityCollectionName, query) {
        /// <summary>Возвращает массив сущностей, удовлетворяющих параметрам запроса</summary>
        /// <param name="entityName">Имя сущности. Регистрозависимый параметр</param>
        /// <param name="query">Параметры запроса. Регистрозависимый параметр</param>
        /// <returns type="Array">Массив найденых сущностей</returns>
        var response = _sendRequestToWebAPIEndpoint("GET", entityCollectionName + query);

        return (response && response.error) ? null : response;
    }

    var _getEntityByGuid = function (entityName, guid, query) {
        /// <summary>Возвращает сущность по заданному уникальному идентификатору</summary>
        /// <param name="entityName">Имя сущности. Регистрозависимый параметр</param>
        /// <param name="guid">Уникальный идентификатор сущности</param>
        /// <param name="query">Параметры запроса. Регистрозависимый параметр</param>
        /// <returns type="Object">Найденная сущность</returns>
        if (!guid) return null;
        var response = _sendRequestToWebAPIEndpoint("GET", entityName + "s(" + guid + ")?" + query);

        return (response && response.error) ? null : response;

    }

    var _userHasRole = function (roleName) {
        /// <summary>Проверяет наличие роли у пользователя</summary>
        /// <param name="roleName">Имя роли(String) или массив ролей(Array)</param>
        /// <returns type="Boolean">True, если у пользователя есть хотя бы одна заданная роль</returns>
        var currentUserRoles = window.parent.Xrm.Page.context.getUserRoles();
        var filter = "";
        var roleNames = (typeof (roleName) == "object") ? roleName : [roleName];

        for (var i in currentUserRoles) {
            filter += (filter) ? " or " : "";
            filter += "roleid eq " + currentUserRoles[i];

        }

        if (filter) {
            var roles = Solution.WebAPI.getEntitiesByQuery("roles", "?$select=name&$filter=" + filter);
            if (roles && roles.value)
                for (var j in roles.value)
                    for (var k in roleNames)
                        if (roles.value[j].name == roleNames[k])
                            return true;
        }

        return false;
    }

    var _createEntity = function (entityName, data) {
        var response = _sendRequestToWebAPIEndpoint("POST", entityName + "s", window.JSON.stringify(data), true);
        return entityUri;
    }

    var _updateEntity = function (entityName, guid, data) {
        var response = _sendRequestToWebAPIEndpoint("PATCH", entityName + "s(" + guid + ")", window.JSON.stringify(data));
        return response == null;
    }

    var _deleteEntity = function (entityName, guid) {
        var response = _sendRequestToWebAPIEndpoint(entityName + "s(" + guid + ")/description");
    }

    return {
        serverUrl: _serverUrl,
        oDataPath: _ODataPath,
        getDataByQuery: _getDataByQuery,
        getEntitiesByQuery: _getEntitiesByQuery,
        getEntityByGuid: _getEntityByGuid,
        userHasRole: _userHasRole,
        createEntity: _createEntity,
        updateEntity: _updateEntity,
        deleteEntity: _deleteEntity
    };
}();

Solution.HTML = function () {

    var _list_OnChange = function (list_id_name) {

        if (list_id_name == "entity_list") {
            $("#entity_attributes_list").empty();
            $("#entity_attributes_list_one").empty();
            $('<option disabled="" style="display: none;" selected=""></option>').appendTo(entity_attributes_list);
            $('<option disabled="" style="display: none;" selected=""></option>').appendTo(entity_attributes_list_one);

            _hideAttribute(["execute_test_transfer_status_field"]);

            //add entity attributes to mapping table
            var entity_MetadataId = $("#entity_list option:selected").attr('id');
            var entity_Attributes = Solution.WebAPI.getDataByQuery("EntityDefinitions(" + entity_MetadataId + ")/Attributes");

            if (entity_Attributes != null && entity_Attributes.value != null && entity_Attributes.value.length > 0) {
                for (var i = 0; i < entity_Attributes.value.length; i++) {
                    var id = entity_Attributes.value[i].MetadataId;
                    var type = entity_Attributes.value[i].AttributeType;
                    var logical_name = entity_Attributes.value[i].LogicalName;
                    var display_name = (Solution.WebAPI.getDataByQuery("EntityDefinitions(" + entity_MetadataId + ")/Attributes(" + id + ")?$select=DisplayName")).DisplayName.UserLocalizedLabel;

                    if (display_name != null && type != "Virtual" && type != "Uniqueidentifier") {
                        //add option in entity_attributes_list
                        var new_entity_attr_option = document.createElement('option');
                        new_entity_attr_option.innerHTML = logical_name + "   (" + display_name.Label + ")";
                        new_entity_attr_option.setAttribute("id", id);
                        entity_attributes_list.appendChild(new_entity_attr_option);

                        //add option in entity_attributes_list_one
                        var new_entity_attr_option_one = document.createElement('option');
                        new_entity_attr_option_one.innerHTML = logical_name + "   (" + display_name.Label + ")";
                        new_entity_attr_option_one.setAttribute("id", id);
                        entity_attributes_list_one.appendChild(new_entity_attr_option_one);

                        //add row in attributes_execute_operation_table
                        $(".attributes_execute_operation_table").append("<div class=\"row\">" +
                            "<div class=\"colomn first_colomn\"><input type=\"checkbox\"></div>" +
                            "<div class=\"colomn\" style=\"padding-left: 2px;\"><span class=\"colomn_span second_colomn\">" + display_name.Label + "</span></div>" +
                            "<div class=\"colomn\"><span class=\"colomn_span third_colomn\">" + logical_name + "</span></div>" +
                            "<div class=\"colomn\"><span class=\"colomn_span fourth_colomn\">" + type + "</span></div>" +
                            "</div>");
                    }
                }
            }
        }
        else if (list_id_name == "source_list") {
            //user has choosen transfer way
            var tBody = $('#table_crm_fields').children('tbody')[0];
            var tBodyTrLength = tBody.childElementCount;
            $("#entity_attributes_list").val($("#entity_attributes_list option:first").val());
            $("#entity_attributes_list_one").val($("#entity_attributes_list_one option:first").val());
            $("#datasource_colomn_list").empty();
            _hideAttribute(["execute_plugin_field", "table_mapping", "plus_image", "table_crm_fields", "plus_image_crm_fields", "execute_test_transfer_status_field"]);
            var source_list_sel_id = $("#source_list option:selected").attr('id');

            if (tBodyTrLength > 2) {
                for (var i = tBodyTrLength - 1; i > 1; i--)
                    tBody.children[i].remove();
            }

            if (source_list_sel_id == "source_list_1") {
                //user has choosen database as transfer way
                source_list_choose_db_count++;
                source_list_choose_service_count = 0;
                source_list_choose_rabbit_count = 0;

                _removeAttribute(["datasource_name_field", "service_way_field", "service_way_example_field", "iservice_name_field", "iservice_name_example_field",
                    "service_function_name_field", "service_function_name_example_field", "btnRabbitConnectionUri", "btnRabbitConnectionParams",
                    "rabbit_uri_name_field", "rabbit_uri_queue_field", "rabbit_uri_routingkey_field", "rabbit_params_host_name_field", "rabbit_params_queue_field",
                    "rabbit_params_routingkey_field", "rabbit_params_port_field", "rabbit_params_virtualhost_name_field", "rabbit_params_username_field", "rabbit_params_password_field"]);

                if (source_list_choose_db_count == 1) {
                    $('#CustomizeDataSource').after(
                    '<button class="" id="btnDBConnectionStr" type="button">Подключение к БД через строку подключения</button>' +
                    '<button class="" id="btnDBConnectionGenStr" type="button">Генерация строки подключения к БД</button>');

                    $("#btnDBConnectionStr").on("click", function () { _btn_OnClick("btnDBConnectionStr") });
                    $("#btnDBConnectionGenStr").on("click", function () { _btn_OnClick("btnDBConnectionGenStr") });
                }
            }
            else if (source_list_sel_id == "source_list_2") {
                //user has choosen WCF Service as transfer way
                source_list_choose_service_count++;

                //clear fields for database choice
                auth = "";
                source_list_choose_db_count = 0;
                btnDBConnectionStr_click_count = 0;
                btnDBConnectionGenStr_click_count = 0;
                btnDBConnectionWinAuth_click_count = 0;
                btnDBConnectionSqlAuth_click_count = 0;

                //clear fields for rabbit choice
                source_list_choose_rabbit_count = 0;

                _removeAttribute(["btnDBConnectionStr", "btnDBConnectionGenStr", "btnDBConnectionWinAuth", "btnDBConnectionSqlAuth", "host_name_field",
                    "host_login_name_field", "host_pwd_name_field", "db_name_field", "datasource_name_field", "db_table_name_field", "btnRabbitConnectionUri",
                    "btnRabbitConnectionParams", "rabbit_uri_name_field", "rabbit_uri_queue_field", "rabbit_uri_routingkey_field", "rabbit_params_host_name_field",
                    "rabbit_params_queue_field", "rabbit_params_routingkey_field", "rabbit_params_port_field", "rabbit_params_virtualhost_name_field",
                    "rabbit_params_username_field", "rabbit_params_password_field"]);

                if (source_list_choose_service_count == 1) {
                    $('#CustomizeDataSource').after(
                    '<div class="div-field" id="service_way_field" style="width: 100%;">' +
                    '<span class="span" id="service_way_span">Путь к веб-сервису</span>' +
                    '<input class="input" id="service_way_input">' +
                    '</div>' +

                    '<div class="div-field" id="service_way_example_field" style="width: 100%;">' +
                    '<span class="span" id="service_way_example_span">(Пример: http://crm2016/ISV/DemoWcfServiceCrm2016/Service1.svc)</span>' +
                    '</div>' +

                    '<div class="div-field" id="iservice_name_field" style="width: 100%;">' +
                    '<span class="span" id="iservice_name_span">Название интерфейса</span>' +
                    '<input class="input" id="iservice_name_input">' +
                    '</div>' +

                    '<div class="div-field" id="iservice_name_example_field" style="width: 100%;">' +
                    '<span class="span" id="iservice_name_example_span">(Пример: IService1)</span>' +
                    '</div>' +

                    '<div class="div-field" id="service_function_name_field" style="width: 100%;">' +
                    '<span class="span" id="service_function_name_span">Название метода</span>' +
                    '<input class="input" id="service_function_name_input">' +
                    '<button class="btnSourceConnection" id="btnSourceConnection_service" type="button">Выполнить тестовую передачу данных</button>' +
                    '</div>' +

                    '<div class="div-field" id="service_function_name_example_field" style="width: 100%;">' +
                    '<span class="span" id="service_function_name_example_span">(Пример: GetData)</span>' +
                    '</div>');
                }

                $("#btnSourceConnection_service").on("click", function () { _btn_OnClick("btnSourceConnection_service") });
            }
            else if (source_list_sel_id == "source_list_3") {
                //user has choosen RabbitMQ as transfer way
                source_list_choose_rabbit_count++;

                //remove fields and buttons for database choice
                auth = "";
                source_list_choose_db_count = 0;
                btnDBConnectionStr_click_count = 0;
                btnDBConnectionGenStr_click_count = 0;
                btnDBConnectionWinAuth_click_count = 0;
                btnDBConnectionSqlAuth_click_count = 0;

                //remove fields and buttons for service choice
                source_list_choose_service_count = 0;

                _removeAttribute(["btnDBConnectionStr", "btnDBConnectionGenStr", "btnDBConnectionWinAuth", "btnDBConnectionSqlAuth", "host_name_field",
                    "host_login_name_field", "host_pwd_name_field", "db_name_field", "datasource_name_field", "db_table_name_field", "service_way_field",
                    "service_way_example_field", "iservice_name_field", "iservice_name_example_field", "service_function_name_field", "service_function_name_example_field"]);

                if (source_list_choose_rabbit_count == 1) {
                    $('#CustomizeDataSource').after(
                    '<button class="" id="btnRabbitConnectionUri" type="button">Доступ по Uri</button>' +
                    '<button class="" id="btnRabbitConnectionParams" type="button">Доступ по параметрам</button>');

                    $("#btnRabbitConnectionUri").on("click", function () { _btn_OnClick("btnRabbitConnectionUri") });
                    $("#btnRabbitConnectionParams").on("click", function () { _btn_OnClick("btnRabbitConnectionParams") });
                }
            }
        }
        else if (list_id_name == "operation_list") {
            //change search_image background color if Operation = Update
            if ($("#operation_list option:selected").text() == "Update") {
                $("#attributes_execute_operation_div_for_image").css("background-color", "white");
            }
            else {
                $("#attributes_execute_operation_div_for_image").css("background-color", "#E8E8E8");
            }
        }
        else if (list_id_name == "entity_attributes_list") {
            entityfields[list_id_name] = $("#" + list_id_name + " option:selected").text();
        }
        else if (list_id_name == "entity_attributes_list_one") {
            entityfieldsone[list_id_name] = $("#" + list_id_name + " option:selected").text();
        }
        else if (list_id_name == "datasource_colomn_list") {
            datasourcefields[list_id_name] = $("#" + list_id_name + " option:selected").text();
        }
    }

    var _div_OnClick = function (div_id_name) {
        if (div_id_name == "attributes_execute_operation_div_for_image") {
            //open and hide table for selecting filtering attributes
            if ($("#attributes_execute_operation_div").is(':hidden')) $("#attributes_execute_operation_div").toggle();
            else $("#attributes_execute_operation_div").hide();
        }
    }

    var _image_OnClick = function (image_id_name) {
        if (image_id_name == "plus_image") {
            //add row in mappig table if user click on plus button
            $('#table_mapping tr:last').after(
               '<tr>' +
               '<td style="padding-bottom: 0px;padding-top: 0px;">' +
                   '<select class="list table_list" style="height: 26px; padding-left: 3px;">' +
                       '<option selected disabled style="display: none; border: 0px;" class="table_option"></option>' +
                   '</select>' +
               '</td>' +
               '<td style="padding-bottom: 0px;padding-top: 0px;">' +
                   '<select class="list table_list" style="height: 26px; padding-left: 3px;">' +
                       '<option selected disabled style="display: none; border: 0px;" class="table_option"></option>' +
                   '</select>' +
               '</td>' +
               '</tr>');

            var new_id_0 = "added_row_0_" + table_row_count.toString();
            var new_id_1 = "added_row_1_" + table_row_count.toString();
            $('#table_mapping tr:last').find('td:eq(0)')[0].childNodes[0].id = new_id_0;
            $('#table_mapping tr:last').find('td:eq(1)')[0].childNodes[0].id = new_id_1;

            entityfieldsIds.push(new_id_0);
            datasourcefieldsIds.push(new_id_1);
            entityfields[new_id_0] = "";
            datasourcefields[new_id_1] = "";

            $('#entity_attributes_list option').each(function () {
                var new_entity_attr_option = document.createElement('option');
                new_entity_attr_option.innerHTML = this.text;
                new_entity_attr_option.setAttribute("id", this.id);
                document.getElementById(new_id_0).appendChild(new_entity_attr_option);
            });

            $('#datasource_colomn_list option').each(function () {
                var new_entity_attr_option = document.createElement('option');
                new_entity_attr_option.innerHTML = this.text;
                new_entity_attr_option.setAttribute("id", this.id);
                document.getElementById(new_id_1).appendChild(new_entity_attr_option);
            });

            document.getElementById(new_id_0).childNodes[1].remove();
            document.getElementById(new_id_1).childNodes[1].remove();

            $("#" + new_id_0).on("change", function () {
                entityfields[new_id_0] = $("#" + new_id_0 + " option:selected").text();
            });
            $("#" + new_id_1).on("change", function () {
                datasourcefields[new_id_1] = $("#" + new_id_1 + " option:selected").text();
            });

            table_row_count++;
        }
        else if (image_id_name == "plus_image_crm_fields") {
            //add row in table_crm_fields if user click on plus button
            $('#table_crm_fields tr:last').after(
               '<tr>' +
               '<td style="padding-bottom: 0px;padding-top: 0px;">' +
                   '<select class="list table_list_one" style="height: 26px; padding-left: 3px; width: 438px;">' +
                       '<option selected disabled style="display: none; border: 0px;" class="table_option"></option>' +
                   '</select>' +
               '</td>' +
               '</tr>');

            var new_id_0 = "added_row_0_" + table_row_count.toString();
            $('#table_crm_fields tr:last').find('td:eq(0)')[0].childNodes[0].id = new_id_0;

            entityfieldsoneIds.push(new_id_0);
            entityfieldsone[new_id_0] = "";

            $('#entity_attributes_list_one option').each(function () {
                var new_entity_attr_option = document.createElement('option');
                new_entity_attr_option.innerHTML = this.text;
                new_entity_attr_option.setAttribute("id", this.id);
                document.getElementById(new_id_0).appendChild(new_entity_attr_option);
            });

            document.getElementById(new_id_0).childNodes[1].remove();

            $("#" + new_id_0).on("change", function () {
                entityfieldsone[new_id_0] = $("#" + new_id_0 + " option:selected").text();
            });

            table_row_count++;
        }
    }

    var _CallAction = function (query, data, callback) {
        var url = window.parent.Xrm.Page.context.getClientUrl() + "/api/data/v8.0/" + query;
        var req = new XMLHttpRequest();
        req.open("POST", url, true);
        req.setRequestHeader("Accept", "application/json");
        req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        req.setRequestHeader("OData-MaxVersion", "4.0");
        req.setRequestHeader("OData-Version", "4.0");
        req.onreadystatechange = function () {
            if (this.readyState == 4) {
                req.onreadystatechange = null;
                if (this.status == 200) {
                    callback(req.response);
                } else {
                    rabbitUri = "";
                    rabbitQueue = "";
                    rabbitRoutingKey = "";

                    _hideAttribute(["table_crm_fields", "plus_image_crm_fields"]);
                    _showAttribute(["execute_test_transfer_status_field"]);

                    var error = JSON.parse(this.response).error;
                    alert(error.message);
                }
            }
        };
        req.send(window.JSON.stringify(data));
    }

    var _ActionCallBackSqlDb = function (response) {
        var output_parts = response.split(",")[1].split("\"")[3].split(":");

        if (output_parts[0] == "db_server_win") {
            //кнопка: Генерация строки подключения к бд: Интегрированная аутентификация: подключение к серверу
            $("#db_name_list_win").empty();
            $('<option disabled="" style="display: none;" selected=""></option>').appendTo(db_name_list_win);
            result_constring = "";
            var database_list = output_parts[1].split("&")[1].slice(0, -1).split(';');
            var option_id = -1;

            for (var i = 0; i < database_list.length; i++) {
                var new_db_name_option = document.createElement('option');
                new_db_name_option.innerHTML = database_list[i];
                new_db_name_option.setAttribute("id", option_id + 1);
                db_name_list_win.appendChild(new_db_name_option);
                option_id = option_id + 1;
            }
        }
        else if (output_parts[0] == "db_server_sql") {
            //кнопка: Генерация строки подключения к бд: Аутентификация SQL Server: подключение к серверу
            $("#db_name_list_sql").empty();
            $('<option disabled="" style="display: none;" selected=""></option>').appendTo(db_name_list_sql);
            result_constring = "";
            var database_list = output_parts[1].split("&")[1].slice(0, -1).split(';');
            var option_id = -1;

            for (var i = 0; i < database_list.length; i++) {
                var new_db_name_option = document.createElement('option');
                new_db_name_option.innerHTML = database_list[i];
                new_db_name_option.setAttribute("id", option_id + 1);
                db_name_list_sql.appendChild(new_db_name_option);
                option_id = option_id + 1;
            }
        }
        else if (output_parts[0] == "db") {
            //кнопка: подключение к БД через строку подключения: выполнить подключение
            $("#db_table_name_list").empty();
            $('<option disabled="" style="display: none;" selected=""></option>').appendTo(db_table_name_list);
            result_constring = "";
            var table_list = output_parts[1].split("&")[1].slice(0, -1).split(';');
            var option_id = -1;

            for (var i = 0; i < table_list.length; i++) {
                var new_table_name_option = document.createElement('option');
                new_table_name_option.innerHTML = table_list[i];
                new_table_name_option.setAttribute("id", option_id + 1);
                db_table_name_list.appendChild(new_table_name_option);
                option_id = option_id + 1;
            }
        }
        else if (output_parts[0] == "db_name") {
            //кнопка: Генерация строки подключения к бд: Интегрированная аутентификация: подключение к базе данных
            //кнопка: Генерация строки подключения к бд: Аутентификация SQL Server: подключение к базе данных
            $("#db_table_name_list").empty();
            $('<option disabled="" style="display: none;" selected=""></option>').appendTo(db_table_name_list);
            result_constring = "";
            var table_list = output_parts[1].split("&")[1].slice(0, -1).split(';');
            var option_id = -1;

            for (var i = 0; i < table_list.length; i++) {
                var new_table_name_option = document.createElement('option');
                new_table_name_option.innerHTML = table_list[i];
                new_table_name_option.setAttribute("id", option_id + 1);
                db_table_name_list.appendChild(new_table_name_option);
                option_id = option_id + 1;
            }
        }
        else if (output_parts[0] == "db_server") {
            result_constring = "";
            var database_list = output_parts[1].split("&")[1].slice(0, -1).split(';');
            var option_id = -1;

            for (var i = 0; i < database_list.length; i++) {
                var new_db_name_option = document.createElement('option');
                new_db_name_option.innerHTML = database_list[i];
                new_db_name_option.setAttribute("id", option_id + 1);
                db_name_list.appendChild(new_db_name_option);
                option_id = option_id + 1;
            }
        }
        else if (output_parts[0] == "db_table_name") {
            $("#datasource_colomn_list").empty();
            $("#execute_plugin_list").empty();

            _showAttribute(["execute_plugin_field", "table_mapping", "plus_image"]);

            $('<option disabled="" style="display: none;" selected=""></option>').appendTo(datasource_colomn_list);
            $('<option disabled="" style="display: none;" selected=""></option>').appendTo(execute_plugin_list);
            result_constring = output_parts[1].split("&")[0];
            var colomn_list = output_parts[1].split("&")[1].slice(0, -1).split(';');

            for (var i = 0; i < colomn_list.length; i++) {
                var new_colomn_name_option = document.createElement('option');
                new_colomn_name_option.innerHTML = colomn_list[i];
                datasource_colomn_list.appendChild(new_colomn_name_option);
            }

            for (var i = 0; i < colomn_list.length; i++) {
                var new_colomn_name_option = document.createElement('option');
                new_colomn_name_option.innerHTML = colomn_list[i];
                execute_plugin_list.appendChild(new_colomn_name_option);
            }
        }
    }

    var _ActionCallBackRabbit = function (response) {
        if (response && response != "") {
            var output = response.substring(response.indexOf('output') + 9);
            var output_parts = output.split("*");

            if (output_parts[0].replace('"', "") == "RabbitMQ_Test_transfer_Uri") {
                if (output_parts[1].replace('}', '').replace('\n', '').replace('"', '') == "success") {
                    rabbitUri = output_parts[2].replace('{', '').replace('}', '').replace('\"', '');
                    _hideAttribute(["execute_test_transfer_status_field"]);
                    _showAttribute(["table_crm_fields", "plus_image_crm_fields"]);
                }
                else {
                    rabbitUri = "";
                    rabbitQueue = "";
                    rabbitRoutingKey = "";
                    _hideAttribute(["table_crm_fields", "plus_image_crm_fields"]);
                    _showAttribute(["execute_test_transfer_status_field"]);
                }
            }
            else if (output_parts[0].replace('"', "") == "RabbitMQ_Test_transfer_Params") {
                if (output_parts[1].replace('}', '').replace('\n', '').replace('"', '') == "success") {
                    rabbitUri = output_parts[2].replace('{', '').replace('}', '').replace('\"', '');
                    _hideAttribute(["execute_test_transfer_status_field"]);
                    _showAttribute(["table_crm_fields", "plus_image_crm_fields"]);
                }
                else {
                    rabbitUri = "";
                    rabbitQueue = "";
                    rabbitRoutingKey = "";
                    _hideAttribute(["table_crm_fields", "plus_image_crm_fields"]);
                    _showAttribute(["execute_test_transfer_status_field"]);
                }
            }
        }
        else {
            rabbitUri = "";
            rabbitQueue = "";
            rabbitRoutingKey = "";
            _showAttribute(["execute_test_transfer_status_field"]);
        }
    }

    var _hideAttribute = function (attrArray) {
        for (var i = 0; i < attrArray.length; i++) {
            if (!$("#" + attrArray[i]).is(':hidden')) {
                $("#" + attrArray[i]).hide();
            }
        }
    }

    var _showAttribute = function (attrArray) {
        for (var i = 0; i < attrArray.length; i++) {
            if ($("#" + attrArray[i]).is(':hidden')) {
                $("#" + attrArray[i]).show();
            }
        }
    }

    var _removeAttribute = function (attrArray) {
        for (var i = 0; i < attrArray.length; i++)
            $("#" + attrArray[i]).remove();
    }

    var _btn_OnClick = function (btn_id_name) {
        if (btn_id_name == "btnCancel") {
            //on cancel click - clear all fields
            $("#source_list").val("");
        }
        else if (btn_id_name == "btnSave") {
            //save settings and create new IntegrationPoint
            //Проверка на заполненность полей
            var entity_string = "";
            var datasource_string = "";

            var htmlElementIds = ["entity_list", "operation_list", "source_list"];
            var htmlElementDisplay = ["Сущность", "Операция", "Источник данных"];

            var htmlElementSqlIds = ["execute_plugin_list", "db_table_name_list"];
            var htmlElementSqlDisplay = ["Идентификатор записи", "Имя таблицы базы данных"];

            var fields_no_filled = [];
            var alert_string = "";
            var transferWay = $("#source_list option:selected").attr('id');
            if (transferWay == "source_list_0") fields_no_filled.push("Не выбран источник данных");

            if (Solution.WebAPI.userHasRole("Системный администратор") != true) {
                fields_no_filled.push("Недостаточно прав для выполнения операции");
            }

            if (transferWay == "source_list_1" && result_constring == "") fields_no_filled.push("Некорректное подключение к источнику данных");
            if (transferWay == "source_list_3" && (rabbitUri == "" || rabbitQueue == "" || rabbitRoutingKey == "")) fields_no_filled.push("Некорректное подключение к источнику данных");
            
            for (var i = 0; i < htmlElementIds.length; i++) {
                if (!($("#" + htmlElementIds[i] + " option:selected").text() && $("#" + htmlElementIds[i] + " option:selected").text() != ""))
                    fields_no_filled.push("Не заполнено поле '" + htmlElementDisplay[i] + "'");
            }

            if (transferWay == "source_list_2" || transferWay == "source_list_3") {
                if (entityfieldsoneIds && entityfieldsoneIds != "") {
                    var entity_string_count = 1;
                    for (var i = 0; i < entityfieldsoneIds.length; i++) {
                        if (entityfieldsone[entityfieldsoneIds[i]] != "") {
                            entity_string += entity_string_count + ".  " + entityfieldsone[entityfieldsoneIds[i]] + "\n"; entity_string_count++;
                        }
                        else fields_no_filled.push("Не все поля сущности указаны");
                    }
                }
                else fields_no_filled.push("Не все поля сущности указаны");
            }
            else {
                for (var i = 0; i < htmlElementSqlIds.length; i++) {
                    if (!($("#" + htmlElementSqlIds[i] + " option:selected").text() && $("#" + htmlElementSqlIds[i] + " option:selected").text() != ""))
                        fields_no_filled.push("Не заполнено поле '" + htmlElementSqlDisplay[i] + "'");
                }

                if (entityfieldsIds && entityfieldsIds != "") {
                    var entity_string_count = 1;
                    for (var i = 0; i < entityfieldsIds.length; i++) {
                        if (entityfields[entityfieldsIds[i]] != "") {
                            entity_string += entity_string_count + ".  " + entityfields[entityfieldsIds[i]] + "\n"; entity_string_count++;
                        }
                        else fields_no_filled.push("Не все поля сущности указаны");
                    }
                }
                else fields_no_filled.push("Не все поля сущности указаны");

                if (datasourcefieldsIds && datasourcefieldsIds != "") {
                    var datasource_string_count = 1;
                    for (var i = 0; i < datasourcefieldsIds.length; i++) {
                        if (datasourcefields[datasourcefieldsIds[i]] != "") {
                            datasource_string += datasource_string_count + ".  " + datasourcefields[datasourcefieldsIds[i]] + "\n";
                            datasource_string_count++;
                        }
                        else fields_no_filled.push("Не все поля источника данных указаны");
                    }
                }
                else fields_no_filled.push("Не все поля источника данных указаны");
            }

            if (fields_no_filled.length > 0) {
                alert_string = "При создании новой конфигурации возникли следующие ошибки:\n";
                for (var i = 0; i < fields_no_filled.length; i++) alert_string += "- " + fields_no_filled[i] + "\n";
                alert(alert_string);
            }
            else {
                var htmlElementIdsPoint = ["entity_list", "operation_list", "execute_plugin_list", "db_table_name_list"];
                var point_field_names = ["new_entity", "new_operation", "new_entity_record_id", "new_databasetablename"];
                var fullEntityName = $("#entity_list option:selected").text();
                var entity_logical_name = fullEntityName.substring(0, fullEntityName.indexOf('(') - 3);
                var event = $("#operation_list option:selected").text();

                //create new integration point
                var new_point = {};
                new_point["new_displayname"] = entity_logical_name + "; " + event; //new_demo_account; Create
                new_point["new_connectionstring"] = result_constring;
                new_point["new_entityfields"] = entity_string;
                if (transferWay == "source_list_1") new_point["new_datasourcefields"] = datasource_string;
                new_point["new_changing_enabled"] = true;
                new_point["new_entity_logical_name"] = entity_logical_name;

                if (transferWay == "source_list_1") {
                    new_point["new_datasource_optionset"] = "100000000";
                    new_point["new_name"] = entity_logical_name + "; " + event + "; Microsoft SQL Server";
                }
                else if (transferWay == "source_list_2") {
                    new_point["new_datasource_optionset"] = "100000001";
                    new_point["new_name"] = entity_logical_name + "; " + event + "; WCF Service";
                }
                else if (transferWay == "source_list_3") {
                    new_point["new_datasource_optionset"] = "100000002";
                    new_point["new_name"] = entity_logical_name + "; " + event + "; RabbitMQ";
                    new_point["new_rabbit_uri"] = rabbitUri;
                    new_point["new_rabbit_queue"] = rabbitQueue;
                    new_point["new_rabbit_routingkey"] = rabbitRoutingKey;
                }

                for (var i = 0; i < htmlElementIdsPoint.length; i++)
                    new_point[point_field_names[i]] = $("#" + htmlElementIdsPoint[i] + " option:selected").text();

                var createdPoint = Solution.WebAPI.createEntity("new_integrationpoint", new_point);
                var createdPointId = createdPoint.substring(createdPoint.indexOf('(') + 1, createdPoint.indexOf(')'));

                var pointUpdateChangeFlag = {};
                pointUpdateChangeFlag["new_changing_enabled"] = false;
                Solution.WebAPI.updateEntity("new_integrationpoint", createdPointId, pointUpdateChangeFlag);
                alert("Новая точка интеграции добавлена в систему.");
            }
        }
        else if (btn_id_name == "attributes_execute_operation_button") {
            //open and hide table for selecting filtering attributes
            if ($("#attributes_execute_operation_div").is(':hidden')) {
                $("#attributes_execute_operation_div").toggle();
            }
            else {
                $("#attributes_execute_operation_div").hide();
            }
        }
        else if (btn_id_name == "btnSourceConnection_service") {
            //кнопка: выполнить тестовую передачу данных (в веб сервис)

            //вызов IntegrationAction с параметрами: btnSourceConnection_service, Test_transfer

            //delete rows in tables
            entityfieldsoneIds = ["entity_attributes_list_one"];
            entityfieldsone["entity_attributes_list_one"] = "";

            entityfieldsIds = ["entity_attributes_list"];
            datasourcefieldsIds = ["datasource_colomn_list"];
            entityfields["entity_attributes_list"] = "";
            datasourcefields["datasource_colomn_list"] = "";

            var tBody = $('#table_crm_fields').children('tbody')[0];
            var tBodyTrLength = tBody.childElementCount;

            if (tBodyTrLength > 2) {
                for (var i = tBodyTrLength - 1; i > 1; i--)
                    tBody.children[i].remove();
            }

            $("#entity_attributes_list").val($("#entity_attributes_list option:first").val());
            $("#entity_attributes_list_one").val($("#entity_attributes_list_one option:first").val());
            $("#datasource_colomn_list").empty();

            _showAttribute(["table_crm_fields", "plus_image_crm_fields"]);
        }
        else if (btn_id_name == "btnRabbitConnectionUri") {
            //кнопка: Доступ по Uri
            btnRabbitConnectionUri_click_count++;
            btnRabbitConnectionParams_click_count = 0;
            _hideAttribute(["table_crm_fields", "plus_image_crm_fields", "execute_test_transfer_status_field"]);

            _removeAttribute(["rabbit_params_host_name_field", "rabbit_params_queue_field", "rabbit_params_routingkey_field", "rabbit_params_port_field",
                "rabbit_params_virtualhost_name_field", "rabbit_params_username_field", "rabbit_params_password_field"]);

            if (btnRabbitConnectionUri_click_count == 1) {
                $('#btnRabbitConnectionUri').after(
                    '<div class="div-field" id="rabbit_uri_name_field" style="width: 100%;">' +
                    '<span class="span" id="rabbit_uri_name_span">Uri</span>' +
                    '<input class="input" id="rabbit_uri_name_input">' +

                    '<div class="div-field" id="rabbit_uri_queue_field" style="width: 100%;">' +
                    '<span class="span" id="rabbit_uri_queue_span">Queue</span>' +
                    '<input class="input" id="rabbit_uri_queue_input">' +
                    '</div>' +

                    '<div class="div-field" id="rabbit_uri_routingkey_field" style="width: 100%;">' +
                    '<span class="span" id="rabbit_uri_routingkey_span">RoutingKey</span>' +
                    '<input class="input" id="rabbit_uri_routingkey_input">' +

                    '<button class="btnSourceConnection" id="btnSourceConnection_rabbit_uri" type="button">Выполнить тестовую передачу данных</button>' +
                    '</div>');

                $("#btnSourceConnection_rabbit_uri").on("click", function () { _btn_OnClick("btnSourceConnection_rabbit_uri") });
            }

            //delete rows in tables
            entityfieldsoneIds = ["entity_attributes_list_one"];
            entityfieldsone["entity_attributes_list_one"] = "";

            entityfieldsIds = ["entity_attributes_list"];
            datasourcefieldsIds = ["datasource_colomn_list"];
            entityfields["entity_attributes_list"] = "";
            datasourcefields["datasource_colomn_list"] = "";

            var tBody = $('#table_crm_fields').children('tbody')[0];
            var tBodyTrLength = tBody.childElementCount;

            if (tBodyTrLength > 2) {
                for (var i = tBodyTrLength - 1; i > 1; i--)
                    tBody.children[i].remove();
            }

            $("#entity_attributes_list").val($("#entity_attributes_list option:first").val());
            $("#entity_attributes_list_one").val($("#entity_attributes_list_one option:first").val());
            $("#datasource_colomn_list").empty();
        }
        else if (btn_id_name == "btnSourceConnection_rabbit_uri") {
            //кнопка: Доступ по Uri -> Выполнить тестовую передачу данных (RabbitMQ)
            entityfieldsoneIds = ["entity_attributes_list_one"];
            entityfieldsone["entity_attributes_list_one"] = "";
            entityfieldsIds = ["entity_attributes_list"];
            datasourcefieldsIds = ["datasource_colomn_list"];
            entityfields["entity_attributes_list"] = "";
            datasourcefields["datasource_colomn_list"] = "";
            var tBody = $('#table_crm_fields').children('tbody')[0];
            var tBodyTrLength = tBody.childElementCount;

            if (tBodyTrLength > 2) {
                for (var i = tBodyTrLength - 1; i > 1; i--)
                    tBody.children[i].remove();
            }

            $("#entity_attributes_list").val($("#entity_attributes_list option:first").val());
            $("#entity_attributes_list_one").val($("#entity_attributes_list_one option:first").val());
            $("#datasource_colomn_list").empty();

            //вызов RabbitMQAction с параметрами:
            var uri = $("#rabbit_uri_name_input")[0].value;
            rabbitQueue = $("#rabbit_uri_queue_input")[0].value;
            rabbitRoutingKey = $("#rabbit_uri_routingkey_input")[0].value;
          
            if (uri && rabbitQueue && rabbitRoutingKey) {
                var input = {
                    "input": "RabbitMQ_Test_transfer_Uri;"
                        + "Uri=" + uri + ";"
                        + "Queue=" + rabbitQueue + ";"
                        + "RoutingKey=" + rabbitRoutingKey + ";"
                };

                _CallAction("new_RabbitMQAction", input, _ActionCallBackRabbit);
            }
            else
                alert("Все строки обязательны к заполнению.");
        }
        else if (btn_id_name == "btnRabbitConnectionParams") {
            //кнопка: Доступ по параметрам
            btnRabbitConnectionParams_click_count++;
            _hideAttribute(["table_crm_fields", "plus_image_crm_fields", "execute_test_transfer_status_field"]);

            //delete rows in tables
            entityfieldsoneIds = ["entity_attributes_list_one"];
            entityfieldsone["entity_attributes_list_one"] = "";
            entityfieldsIds = ["entity_attributes_list"];
            datasourcefieldsIds = ["datasource_colomn_list"];
            entityfields["entity_attributes_list"] = "";
            datasourcefields["datasource_colomn_list"] = "";
            var tBody = $('#table_crm_fields').children('tbody')[0];
            var tBodyTrLength = tBody.childElementCount;

            if (tBodyTrLength > 2) {
                for (var i = tBodyTrLength - 1; i > 1; i--)
                    tBody.children[i].remove();
            }

            $("#entity_attributes_list").val($("#entity_attributes_list option:first").val());
            $("#entity_attributes_list_one").val($("#entity_attributes_list_one option:first").val());
            $("#datasource_colomn_list").empty();
            btnRabbitConnectionUri_click_count = 0;
            
            _removeAttribute(["rabbit_uri_name_field", "rabbit_uri_queue_field", "rabbit_uri_routingkey_field"]);

            if (btnRabbitConnectionParams_click_count == 1) {
                $('#btnRabbitConnectionParams').after(
                   '<div class="div-field" id="rabbit_params_host_name_field" style="width: 100%;">' +
                    '<span class="span" id="rabbit_params_host_name_span">HostName</span>' +
                    '<input class="input" id="rabbit_params_host_name_input">' +
                    '</div>' +

                    '<div class="div-field" id="rabbit_params_port_field" style="width: 100%;">' +
                    '<span class="span" id="rabbit_params_port_span">Port</span>' +
                    '<input class="input" id="rabbit_params_port_input">' +
                    '</div>' +

                    '<div class="div-field" id="rabbit_params_virtualhost_name_field" style="width: 100%;">' +
                    '<span class="span" id="rabbit_params_virtualhost_name_span">VirtualHost</span>' +
                    '<input class="input" id="rabbit_params_virtualhost_name_input">' +
                    '</div>' +

                    '<div class="div-field" id="rabbit_params_username_field" style="width: 100%;">' +
                    '<span class="span" id="rabbit_params_username_span">UserName</span>' +
                    '<input class="input" id="rabbit_params_username_input">' +
                    '</div>' +

                    '<div class="div-field" id="rabbit_params_password_field" style="width: 100%;">' +
                    '<span class="span" id="rabbit_params_password_span">Password</span>' +
                    '<input class="input" type="password" id="rabbit_params_password_input">' +
                    '</div>' +

                    '<div class="div-field" id="rabbit_params_queue_field" style="width: 100%;">' +
                    '<span class="span" id="rabbit_params_queue_span">Queue</span>' +
                    '<input class="input" id="rabbit_params_queue_input">' +
                    '</div>' +

                    '<div class="div-field" id="rabbit_params_routingkey_field" style="width: 100%;">' +
                    '<span class="span" id="rabbit_params_routingkey_span">RoutingKey</span>' +
                    '<input class="input" id="rabbit_params_routingkey_input">' +
                    '<button class="btnSourceConnection" id="btnSourceConnection_rabbit_params" type="button">Выполнить тестовую передачу данных</button>' +
                    '</div>');

                $("#btnSourceConnection_rabbit_params").on("click", function () { _btn_OnClick("btnSourceConnection_rabbit_params") });
            }
        }
        else if (btn_id_name == "btnSourceConnection_rabbit_params") {
            //кнопка: Доступ по параметрам -> Выполнить тестовую передачу данных (RabbitMQ)
            entityfieldsoneIds = ["entity_attributes_list_one"];
            entityfieldsone["entity_attributes_list_one"] = "";
            entityfieldsIds = ["entity_attributes_list"];
            datasourcefieldsIds = ["datasource_colomn_list"];
            entityfields["entity_attributes_list"] = "";
            datasourcefields["datasource_colomn_list"] = "";
            var tBody = $('#table_crm_fields').children('tbody')[0];
            var tBodyTrLength = tBody.childElementCount;

            if (tBodyTrLength > 2) {
                for (var i = tBodyTrLength - 1; i > 1; i--)
                    tBody.children[i].remove();
            }

            $("#entity_attributes_list").val($("#entity_attributes_list option:first").val());
            $("#entity_attributes_list_one").val($("#entity_attributes_list_one option:first").val());
            $("#datasource_colomn_list").empty();

            //вызов RabbitMQAction с параметрами:
            var hostName = $("#rabbit_params_host_name_input")[0].value;
            var port = $("#rabbit_params_port_input")[0].value;
            var virtualHost = $("#rabbit_params_virtualhost_name_input")[0].value;
            var userName = $("#rabbit_params_username_input")[0].value;
            var password = $("#rabbit_params_password_input")[0].value;
            rabbitQueue = $("#rabbit_params_queue_input")[0].value;
            rabbitRoutingKey = $("#rabbit_params_routingkey_input")[0].value;

            if (hostName && virtualHost && userName && password && rabbitQueue && rabbitRoutingKey) {
                var input = {
                    "input": "RabbitMQ_Test_transfer_Params;"
                        + "HostName=" + hostName + ";"
                        + "Port=" + port + ";"
                        + "VirtualHost=" + virtualHost + ";"
                        + "UserName=" + userName + ";"
                        + "Password=" + password + ";"
                        + "Queue=" + rabbitQueue + ";"
                        + "RoutingKey=" + rabbitRoutingKey + ";"
                };

                _CallAction("new_RabbitMQAction", input, _ActionCallBackRabbit);
            }
            else
                alert("Для тестового подключения к очереди необходимо заполнить поля: HostName, VirtualHost, UserName, Password, Queue, RoutingKey.");
        }
        else if (btn_id_name == "btnDBConnectionStr") {
            //кнопка: подключение к БД через строку подключения
            auth = "con_string";
            btnDBConnectionGenStr_click_count = 0;
            source_list_choose_service_count = 0;
            btnDBConnectionWinAuth_click_count = 0;
            btnDBConnectionSqlAuth_click_count = 0;
            btnDBConnectionStr_click_count++;

            _removeAttribute(["btnDBConnectionWinAuth", "btnDBConnectionSqlAuth", "host_name_field", "host_login_name_field", "host_pwd_name_field",
                "db_name_field"]);

            if (btnDBConnectionStr_click_count == 1) {
                $('#btnDBConnectionGenStr').after(
                    '<div class="div-field" id="datasource_name_field" style="width: 100%;">' +
                    '<span class="span" id="datasource_name_span">Строка подключения</span>' +
                    '<input class="input" id="datasource_name_input">' +
                    '<button class="btnSourceConnection" id="btnSourceConnection_db" type="button">Выполнить подключение</button>' +
                    '</div>' +

                    '<div class="div-field" id="db_table_name_field">' +
                    '<span class="span" id="db_table_name_span">Имя таблицы базы данных</span>' +
                    '<select class="list" id="db_table_name_list">' +
                    '<option disabled="" style="display: none;" selected=""></option>' +
                    '</select>' +
                    '<button class="btnSourceConnection" id="btnSourceConnection_db_table_name" type="button">Подключение к таблице базы данных</button>' +
                    '</div>');

                $("#btnSourceConnection_db").on("click", function () { _btn_OnClick("btnSourceConnection_db") });
                $("#btnSourceConnection_db_table_name").on("click", function () { _btn_OnClick("btnSourceConnection_db_table_name") });
            }

            //delete rows in tables
            entityfieldsoneIds = ["entity_attributes_list_one"];
            entityfieldsone["entity_attributes_list_one"] = "";

            entityfieldsIds = ["entity_attributes_list"];
            datasourcefieldsIds = ["datasource_colomn_list"];
            entityfields["entity_attributes_list"] = "";
            datasourcefields["datasource_colomn_list"] = "";

            var tBody = $('#table_crm_fields').children('tbody')[0];
            var tBodyTrLength = tBody.childElementCount;

            if (tBodyTrLength > 2) {
                for (var i = tBodyTrLength - 1; i > 1; i--)
                    tBody.children[i].remove();
            }

            $("#entity_attributes_list").val($("#entity_attributes_list option:first").val());
            $("#entity_attributes_list_one").val($("#entity_attributes_list_one option:first").val());
            $("#datasource_colomn_list").empty();

            _hideAttribute(["table_crm_fields", "plus_image_crm_fields"]);
        }
        else if (btn_id_name == "btnSourceConnection_db") {
            //кнопка: подключение к БД через строку подключения: выполнить подключение
            $("#db_table_name_list").empty();
            con_str = $("#datasource_name_input")[0].value;

            if (con_str && con_str != "") {
                var input = {
                    "input": "db:" + con_str
                };

                _CallAction("new_DatabaseAction", input, _ActionCallBackSqlDb);
            }
            else
                alert("Строка подключения не должна быть пустой.");

            //delete rows in tables
            entityfieldsoneIds = ["entity_attributes_list_one"];
            entityfieldsone["entity_attributes_list_one"] = "";

            entityfieldsIds = ["entity_attributes_list"];
            datasourcefieldsIds = ["datasource_colomn_list"];
            entityfields["entity_attributes_list"] = "";
            datasourcefields["datasource_colomn_list"] = "";

            var tBody = $('#table_crm_fields').children('tbody')[0];
            var tBodyTrLength = tBody.childElementCount;

            if (tBodyTrLength > 2) {
                for (var i = tBodyTrLength - 1; i > 1; i--)
                    tBody.children[i].remove();
            }

            $("#entity_attributes_list").val($("#entity_attributes_list option:first").val());
            $("#entity_attributes_list_one").val($("#entity_attributes_list_one option:first").val());
            $("#datasource_colomn_list").empty();

            _hideAttribute(["table_crm_fields", "plus_image_crm_fields"]);
        }
        else if (btn_id_name == "btnSourceConnection_db_table_name") {
            //кнопка: подключение к БД через строку подключения: подключение к таблице базы данных [auth = con_string]
            //кнопка: Генерация строки подключения к бд: Интегрированная аутентификация: подключение к таблице базы данных [auth = win]
            //кнопка: Генерация строки подключения к бд: Аутентификация SQL Server: подключение к таблице базы данных [auth = sql]

            if (auth == "con_string") {
                $("#datasource_colomn_list").empty();
                var db_table_name = $("#db_table_name_list option:selected").text();

                if (db_table_name != "") {
                    var input = {
                        "input": "db_table_name_con_string:" + con_str + "&" + db_table_name
                    };

                    _CallAction("new_DatabaseAction", input, _ActionCallBackSqlDb);
                }
                else
                    alert("Таблица базы данных не выбрана.");
            }
            else if (auth == "win") {
                $("#datasource_colomn_list").empty();
                var db_table_name = $("#db_table_name_list option:selected").text();

                if (db_table_name != "") {
                    var input = {
                        "input": "db_table_name_win:" + servername + ";" + db_name + ";" + db_table_name
                    };

                    _CallAction("new_DatabaseAction", input, _ActionCallBackSqlDb);
                }
                else
                    alert("Таблица базы данных не выбрана.");
            }
            if (auth == "sql") {
                $("#datasource_colomn_list").empty();
                var db_table_name = $("#db_table_name_list option:selected").text();

                if (db_table_name != "") {
                    var input = {
                        "input": "db_table_name_sql:" + servername + ";" + db_name + ";" + login + ";" + password + ";" + db_table_name
                    };

                    _CallAction("new_DatabaseAction", input, _ActionCallBackSqlDb);
                }
                else
                    alert("Таблица базы данных не выбрана.");
            }

            //delete rows in tables
            entityfieldsoneIds = ["entity_attributes_list_one"];
            entityfieldsone["entity_attributes_list_one"] = "";

            entityfieldsIds = ["entity_attributes_list"];
            datasourcefieldsIds = ["datasource_colomn_list"];
            entityfields["entity_attributes_list"] = "";
            datasourcefields["datasource_colomn_list"] = "";

            var tBody = $('#table_crm_fields').children('tbody')[0];
            var tBodyTrLength = tBody.childElementCount;

            if (tBodyTrLength > 2) {
                for (var i = tBodyTrLength - 1; i > 1; i--)
                    tBody.children[i].remove();
            }

            $("#entity_attributes_list").val($("#entity_attributes_list option:first").val());
            $("#entity_attributes_list_one").val($("#entity_attributes_list_one option:first").val());
            $("#datasource_colomn_list").empty();

            _hideAttribute(["table_crm_fields", "plus_image_crm_fields"]);
        }
        else if (btn_id_name == "btnDBConnectionGenStr") {
            //кнопка: Генерация строки подключения к бд
            btnDBConnectionStr_click_count = 0;
            source_list_choose_service_count = 0;
            btnDBConnectionWinAuth_click_count = 0;
            btnDBConnectionSqlAuth_click_count = 0;
            btnDBConnectionGenStr_click_count++;
            con_str = "";

            _removeAttribute(["datasource_name_field", "db_table_name_field"]);

            if (btnDBConnectionGenStr_click_count == 1) {
                $('#btnDBConnectionGenStr').after(
                    '<button class="" id="btnDBConnectionWinAuth" type="button">Интегрированная аутентификация</button>' +
                    '<button class="" id="btnDBConnectionSqlAuth" type="button">Аутентификация SQL Server</button>');

                $("#btnDBConnectionWinAuth").on("click", function () { _btn_OnClick("btnDBConnectionWinAuth") });
                $("#btnDBConnectionSqlAuth").on("click", function () { _btn_OnClick("btnDBConnectionSqlAuth") });
            }

            //delete rows in tables
            entityfieldsoneIds = ["entity_attributes_list_one"];
            entityfieldsone["entity_attributes_list_one"] = "";

            entityfieldsIds = ["entity_attributes_list"];
            datasourcefieldsIds = ["datasource_colomn_list"];
            entityfields["entity_attributes_list"] = "";
            datasourcefields["datasource_colomn_list"] = "";

            var tBody = $('#table_crm_fields').children('tbody')[0];
            var tBodyTrLength = tBody.childElementCount;

            if (tBodyTrLength > 2) {
                for (var i = tBodyTrLength - 1; i > 1; i--)
                    tBody.children[i].remove();
            }

            $("#entity_attributes_list").val($("#entity_attributes_list option:first").val());
            $("#entity_attributes_list_one").val($("#entity_attributes_list_one option:first").val());
            $("#datasource_colomn_list").empty();

            _hideAttribute(["table_crm_fields", "plus_image_crm_fields"]);
        }
        else if (btn_id_name == "btnDBConnectionWinAuth") {
            //кнопка: Генерация строки подключения к бд: Интегрированная аутентификация
            btnDBConnectionWinAuth_click_count++;
            btnDBConnectionSqlAuth_click_count = 0;

            if (btnDBConnectionWinAuth_click_count == 1) {
                _removeAttribute(["host_name_field", "host_login_name_field", "host_pwd_name_field", "db_name_field", "datasource_name_field", "db_table_name_field"]);

                $('#btnDBConnectionSqlAuth').after(
                '<div class="div-field" id="host_name_field" style="width: 100%;">' +
                '<span class="span" id="host_name_span">Имя сервера</span>' +
                '<input class="input" id="host_name_input">' +
                '<button class="btnSourceConnection" id="btnSourceConnection_db_server" type="button">Подключение к серверу</button>' +
                '</div>' +

                '<div class="div-field" id="db_name_field">' +
                '<span class="span" id="db_name_span">Имя базы данных</span>' +
                '<select class="list db_name_list" id="db_name_list_win">' +
                '</select>' +
                '<button class="btnSourceConnection" id="btnSourceConnection_db_name" type="button">Подключение к базе данных</button>' +
                '</div>' +

                '<div class="div-field" id="db_table_name_field">' +
                '<span class="span" id="db_table_name_span">Имя таблицы базы данных</span>' +
                '<select class="list" id="db_table_name_list">' +
                '<option disabled="" style="display: none;" selected=""></option>' +
                '</select>' +
                '<button class="btnSourceConnection" id="btnSourceConnection_db_table_name" type="button">Подключение к таблице базы данных</button>' +
                '</div>');

                $("#btnSourceConnection_db_server").on("click", function () { _btn_OnClick("btnSourceConnection_db_server") });
                $("#btnSourceConnection_db_name").on("click", function () { _btn_OnClick("btnSourceConnection_db_name") });
                $("#btnSourceConnection_db_table_name").on("click", function () { _btn_OnClick("btnSourceConnection_db_table_name") });
                auth = "win";
            }

            //delete rows in tables
            entityfieldsoneIds = ["entity_attributes_list_one"];
            entityfieldsone["entity_attributes_list_one"] = "";

            entityfieldsIds = ["entity_attributes_list"];
            datasourcefieldsIds = ["datasource_colomn_list"];
            entityfields["entity_attributes_list"] = "";
            datasourcefields["datasource_colomn_list"] = "";

            var tBody = $('#table_crm_fields').children('tbody')[0];
            var tBodyTrLength = tBody.childElementCount;

            if (tBodyTrLength > 2) {
                for (var i = tBodyTrLength - 1; i > 1; i--)
                    tBody.children[i].remove();
            }

            $("#entity_attributes_list").val($("#entity_attributes_list option:first").val());
            $("#entity_attributes_list_one").val($("#entity_attributes_list_one option:first").val());
            $("#datasource_colomn_list").empty();

            _hideAttribute(["table_crm_fields", "plus_image_crm_fields"]);
        }
        else if (btn_id_name == "btnSourceConnection_db_server") {
            if (auth == "win") {
                //кнопка: Генерация строки подключения к бд: Интегрированная аутентификация: подключение к серверу
                $("#db_name_list_win").empty();
                servername = $("#host_name_input")[0].value;

                if (servername && servername != "") {
                    var input = {
                        "input": "db_server_win:" + servername + ";"
                    };

                    _CallAction("new_DatabaseAction", input, _ActionCallBackSqlDb);
                }
                else
                    alert("Имя сервера должно быть заполнено.");

                //delete rows in tables
                entityfieldsoneIds = ["entity_attributes_list_one"];
                entityfieldsone["entity_attributes_list_one"] = "";

                entityfieldsIds = ["entity_attributes_list"];
                datasourcefieldsIds = ["datasource_colomn_list"];
                entityfields["entity_attributes_list"] = "";
                datasourcefields["datasource_colomn_list"] = "";

                var tBody = $('#table_crm_fields').children('tbody')[0];
                var tBodyTrLength = tBody.childElementCount;

                if (tBodyTrLength > 2) {
                    for (var i = tBodyTrLength - 1; i > 1; i--)
                        tBody.children[i].remove();
                }

                $("#entity_attributes_list").val($("#entity_attributes_list option:first").val());
                $("#entity_attributes_list_one").val($("#entity_attributes_list_one option:first").val());
                $("#datasource_colomn_list").empty();

                _hideAttribute(["table_crm_fields", "plus_image_crm_fields"]);
            }
            else if (auth == "sql") {
                //кнопка: Генерация строки подключения к бд: Аутентификация SQL Server: подключение к серверу
                $("#db_name_list_sql").empty();
                servername = $("#host_name_input")[0].value;
                login = $("#host_login_name_input")[0].value;
                password = $("#host_pwd_name_input")[0].value;

                if (servername && servername != "" &&
                    login && login != "" &&
                    password && password != "") {
                    var input = {
                        "input": "db_server_sql:" + servername + ";" + login + ";" + password
                    };

                    _CallAction("new_DatabaseAction", input, _ActionCallBackSqlDb);
                }
                else
                    alert("Имя сервера, Логин пользователя, пароль пользователя должны быть заполнены.");
            }

            //delete rows in tables
            entityfieldsoneIds = ["entity_attributes_list_one"];
            entityfieldsone["entity_attributes_list_one"] = "";

            entityfieldsIds = ["entity_attributes_list"];
            datasourcefieldsIds = ["datasource_colomn_list"];
            entityfields["entity_attributes_list"] = "";
            datasourcefields["datasource_colomn_list"] = "";

            var tBody = $('#table_crm_fields').children('tbody')[0];
            var tBodyTrLength = tBody.childElementCount;

            if (tBodyTrLength > 2) {
                for (var i = tBodyTrLength - 1; i > 1; i--)
                    tBody.children[i].remove();
            }

            $("#entity_attributes_list").val($("#entity_attributes_list option:first").val());
            $("#entity_attributes_list_one").val($("#entity_attributes_list_one option:first").val());
            $("#datasource_colomn_list").empty();

            _hideAttribute(["table_crm_fields", "plus_image_crm_fields"]);
        }
        else if (btn_id_name == "btnSourceConnection_db_name") {
            //кнопка: Генерация строки подключения к бд: Интегрированная аутентификация: подключение к базе данных
            //кнопка: Генерация строки подключения к бд: Аутентификация SQL Server: подключение к базе данных

            if (auth == "win") {
                db_name = $("#db_name_list_win option:selected").text();

                if (db_name != "") {
                    var input = {
                        "input": "db_name_win:" + servername + ";" + db_name
                    };

                    _CallAction("new_DatabaseAction", input, _ActionCallBackSqlDb);
                }
                else
                    alert("База данных не выбрана.");
            }
            else if (auth == "sql") {
                db_name = $("#db_name_list_sql option:selected").text();

                if (db_name != "") {
                    var input = {
                        "input": "db_name_sql:" + servername + ";" + login + ";" + password + ";" + db_name
                    };

                    _CallAction("new_DatabaseAction", input, _ActionCallBackSqlDb);
                }
                else
                    alert("База данных не выбрана.");
            }

            //delete rows in tables
            entityfieldsoneIds = ["entity_attributes_list_one"];
            entityfieldsone["entity_attributes_list_one"] = "";

            entityfieldsIds = ["entity_attributes_list"];
            datasourcefieldsIds = ["datasource_colomn_list"];
            entityfields["entity_attributes_list"] = "";
            datasourcefields["datasource_colomn_list"] = "";

            var tBody = $('#table_crm_fields').children('tbody')[0];
            var tBodyTrLength = tBody.childElementCount;

            if (tBodyTrLength > 2) {
                for (var i = tBodyTrLength - 1; i > 1; i--)
                    tBody.children[i].remove();
            }

            $("#entity_attributes_list").val($("#entity_attributes_list option:first").val());
            $("#entity_attributes_list_one").val($("#entity_attributes_list_one option:first").val());
            $("#datasource_colomn_list").empty();

            _hideAttribute(["table_crm_fields", "plus_image_crm_fields"]);
        }
        else if (btn_id_name == "btnDBConnectionSqlAuth") {
            //кнопка: Генерация строки подключения к бд: Аутентификация SQL Server
            btnDBConnectionSqlAuth_click_count++;
            btnDBConnectionWinAuth_click_count = 0;

            if (btnDBConnectionSqlAuth_click_count == 1) {
                _removeAttribute(["host_name_field", "db_name_field", "datasource_name_field", "db_table_name_field"]);

                $('#btnDBConnectionSqlAuth').after(
                '<div class="div-field" id="host_name_field" style="width: 100%;">' +
                '<span class="span" id="host_name_span">Имя сервера</span>' +
                '<input class="input" id="host_name_input">' +
                '</div>' +

                '<div class="div-field" id="host_login_name_field" style="width: 100%;">' +
                '<span class="span" id="host_login_name_span">Логин пользователя</span>' +
                '<input class="input" id="host_login_name_input">' +
                '</div>' +

                '<div class="div-field" id="host_pwd_name_field" style="width: 100%;">' +
                '<span class="span" id="host_pwd_name_span">Пароль пользователя</span>' +
                '<input class="input" type="password" id="host_pwd_name_input">' +
                '<button class="btnSourceConnection" id="btnSourceConnection_db_server" type="button">Подключение к серверу</button>' +
                '</div>' +

                '<div class="div-field" id="db_name_field">' +
                '<span class="span" id="db_name_span">Имя базы данных</span>' +
                '<select class="list db_name_list" id="db_name_list_sql">' +
                '</select>' +
                '<button class="btnSourceConnection" id="btnSourceConnection_db_name" type="button">Подключение к базе данных</button>' +
                '</div>' +

                '<div class="div-field" id="db_table_name_field">' +
                '<span class="span" id="db_table_name_span">Имя таблицы базы данных</span>' +
                '<select class="list" id="db_table_name_list">' +
                '<option disabled="" style="display: none;" selected=""></option>' +
                '</select>' +
                '<button class="btnSourceConnection" id="btnSourceConnection_db_table_name" type="button">Подключение к таблице базы данных</button>' +
                '</div>');

                $("#btnSourceConnection_db_server").on("click", function () { _btn_OnClick("btnSourceConnection_db_server") });
                $("#btnSourceConnection_db_name").on("click", function () { _btn_OnClick("btnSourceConnection_db_name") });
                $("#btnSourceConnection_db_table_name").on("click", function () { _btn_OnClick("btnSourceConnection_db_table_name") });
                auth = "sql";
            }

            //delete rows in tables
            entityfieldsoneIds = ["entity_attributes_list_one"];
            entityfieldsone["entity_attributes_list_one"] = "";

            entityfieldsIds = ["entity_attributes_list"];
            datasourcefieldsIds = ["datasource_colomn_list"];
            entityfields["entity_attributes_list"] = "";
            datasourcefields["datasource_colomn_list"] = "";

            var tBody = $('#table_crm_fields').children('tbody')[0];
            var tBodyTrLength = tBody.childElementCount;

            if (tBodyTrLength > 2) {
                for (var i = tBodyTrLength - 1; i > 1; i--)
                    tBody.children[i].remove();
            }

            $("#entity_attributes_list").val($("#entity_attributes_list option:first").val());
            $("#entity_attributes_list_one").val($("#entity_attributes_list_one option:first").val());
            $("#datasource_colomn_list").empty();

            _hideAttribute(["table_crm_fields", "plus_image_crm_fields"]);
        }
    }

    return {
        list_OnChange: _list_OnChange,
        div_OnClick: _div_OnClick,
        image_OnClick: _image_OnClick,
        btn_OnClick: _btn_OnClick
    };
}();