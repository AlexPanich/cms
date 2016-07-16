@extends('layouts.dashboard')

@section('page_title')
    Страницы
@endsection

@section('content_title')
    Все страницы - Дерево
@endsection()

@section('content')
    @include('dashboard.partitions.tree.page', ['tree' => $tree])
    <br>
    <p><a class="btn btn-primary btn-square" href="{{ route('create_page') }}">Создать страницу</a></p>
    <a href="{{ route('all_pages') }}">Перейти к списку страниц</a>
@endsection