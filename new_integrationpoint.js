if (typeof (Korus) == 'undefined') {
    window.Korus = new Object();
}

/// <summary>Скрипт сущности "Точка интеграции" (new_integrationpoint)</summary>
/// Версия: 1.0.0.0
/// Korus.Common общие методы для работы с CRM формами.
/// Korus.IntegrationPoint - методы на загрузку, сохранение формы сущности "Точка интеграции".

Korus.IntegrationPoint = {
    onLoad: function () {
        var datasource_optionset = Korus.Common.getAttributeKey("new_datasource_optionset"); /*Источник данных*/
        var connectionstringVisible = false; /*Строка подключения*/
        var databasetablenameVisible = false; /*Имя таблицы базы данных*/
        var entity_record_idVisible = false; /*Идентификатор записи в источнике данных*/
        var rabbit_uriVisible = false; /*rabbit_uri*/
        var rabbit_queueVisible = false; /*rabbit_queue*/
        var rabbit_routingkeyVisible = false; /*rabbit_routingkey*/

        if (datasource_optionset == 100000000) /*Microsoft SQL Server*/ {
            connectionstringVisible = true;
            databasetablenameVisible = true;
            entity_record_idVisible = true;
        }
        else if (datasource_optionset == 100000001) /*WCF Service*/ {
        }
        else if (datasource_optionset == 100000002) /*RabbitMQ*/ {
            rabbit_uriVisible = true;
            rabbit_queueVisible = true;
            rabbit_routingkeyVisible = true;
        }
        else {
        }

        Korus.Common.setVisibleControl("new_connectionstring", connectionstringVisible); /*Строка подключения*/
        Korus.Common.setVisibleControl("new_databasetablename", databasetablenameVisible); /*Имя таблицы базы данных*/
        Korus.Common.setVisibleControl("new_entity_record_id", entity_record_idVisible); /*Идентификатор записи в источнике данных*/
        Korus.Common.setVisibleControl("new_rabbit_uri", rabbit_uriVisible); /*rabbit_uri*/
        Korus.Common.setVisibleControl("new_rabbit_queue", rabbit_queueVisible); /*rabbit_queue*/
        Korus.Common.setVisibleControl("new_rabbit_routingkey", rabbit_routingkeyVisible); /*rabbit_routingkey*/
    }
}

Korus.Common = function () {
    var _getAttributeKey = function (attrId) {
        /// <summary>Возвращает кодовое значение атрибута</summary>
        /// <param name="attrId" type="String">Идентификатор атрибута</param>
        /// <returns type="Object">Кодовое значение</returns>
        var attr = Xrm.Page.getAttribute(attrId);
        if (attr) {
            var type = attr.getAttributeType();
            var value = attr.getValue();
            switch (type) {
                case "boolean":
                case "decimal":
                case "double":
                case "integer":
                case "money":
                case "memo":
                case "optionset":
                case "string":
                    return value;
                    break;
                case "datetime":
                    return (value != null) ? value : null;
                    break;
                case "lookup":
                    var data;
                    if (value != null) {
                        for (var i in value) {
                            data = value[i].id;
                        }
                    }
                    else
                        data = value;

                    return data;
                    break;
                default:
                    return null;
            }

            return attr.getValue();
        }
        else {
            alert("getAttrValue: Невозможно найти аттрибут " + attrId);
            return null;
        }
    }

    var _setVisibleControl = function (controlId, visible, required) {
        /// <summary>Отображает\скрывает поле на форме</summary>
        /// <param name="controlId">Идентификатор поля</param>
        /// <param name="visible" type="Boolean">Флаг видимости</param>
        /// <param name="required" type="Boolean">Флаг обязательности</param>
        var control = Xrm.Page.ui.controls.get(controlId);
        if (control) {
            control.setVisible(visible);
        }
    }
    
    return {
        getAttributeKey: _getAttributeKey,
        setVisibleControl: _setVisibleControl
    };
}();