@extends('layouts.dashboard')

@section('page_title')
    Страницы
@endsection

@section('content_title')
    Дерево страниц
@endsection()

@section('content')
    @include('dashboard.partitions.tree.page', ['tree' => $tree])
    <br>
    <p><a class="btn btn-primary btn-square" href="{{ route('create_page') }}">Создать страницу</a></p>
    <a href="">Перейти к списку страниц</a>
@endsection