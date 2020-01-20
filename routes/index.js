var express = require('express'),
    csv = require('csv-parser'),
    fs = require('fs'),
    router = express.Router(),
    Sequelize = require('sequelize'),
    sequelize = new Sequelize('postgres://login:password@localhost:5432/dbname');

var rows = [], schema = {
    login: Sequelize.STRING,
    email: Sequelize.STRING,
    registred: Sequelize.BIGINT,
    status: Sequelize.SMALLINT,
};

var Users = sequelize.define('users', schema, {
    freezeTableName: true
});

fs.createReadStream('public/upload/report.csv')
    .pipe(
        csv({
            mapHeaders: ({header}) => header.trim(),
            mapValues: ({header, i, value}) => value.trim(),
            separator: ';'
        })
    )
    .on('data', row => {
        row.Зарегистрирован = Date.parse(
            row.Зарегистрирован.replace(/(\d{2})\.(\d{2})\.(\d{4})/, '$2-$1-$3')
        );
        row.Статус = row.Статус === 'On' ? 1 : 0;
        rows.push(row);
    })
    .on('end', () => {
        Users.sync({force: true}).then(() => {
            rows.forEach(row => {
                return Users.create({
                    login: row.Ник,
                    email: row.Email,
                    registred: row.Зарегистрирован,
                    status: row.Статус
                });
            });
        })
    });

router.get('/', (req, res) => {
    Users.findAll({
        where: { status: 1 },
        order: [
            [
                'registred', 'DESC'
            ]
        ],
        raw: true
    }).then(data => {
        res.render('index', { status: 'success', users: data });
    }).catch((err) => {
        console.error(err);
        res.render('index', { status: 'error', users: [], error: err });
    });
});

module.exports = router;