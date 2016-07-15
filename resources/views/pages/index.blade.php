@extends('layouts.page')

@section('body')
    <div class="container">
        @include('pages.top_menu')
        <h1>Главная страница</h1>
        @widget('Gallery', [], 'main')
    </div>
    @parent
@endsection
