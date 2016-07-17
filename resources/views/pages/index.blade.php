@extends('layouts.page')

@section('body')
    <div class="container">
        @include('pages.top_menu')
        <h1>Главная страница</h1>
        <p>Для входа в админку авторизуйтесь</p>
        <p>email: admin@admin.ru</p>
        <p>пароль: 123456</p>
        @widget('Gallery', [], 'main')
    </div>
    @parent
@endsection
