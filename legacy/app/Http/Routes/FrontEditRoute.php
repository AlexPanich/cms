<?php

Route::post('/frontedit/get{className}', [
    'uses' => 'FrontEditController@getModel',
    'as' => 'front_edit'
]);

Route::post('/frontedit/save{className}', [
    'uses' => 'FrontEditController@saveModel',
    'as' => 'front_edit_save'
]);