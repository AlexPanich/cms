<?php
return [
    'pages' => [
       'fields' => ['title', 'content'],
       'where' => 'is_show = 1',
       'template' => 'search.pages'
    ],
    'users' => [
        'fields' => ['name'],
        'template' => 'search.users'
    ]
];